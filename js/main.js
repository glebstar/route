/**
 * Created by gleb on 04.09.2016.
 */

var max_points = 300;
var currrent_user = 0;
var current_map = 'vector';
var support_geo = false;
var sent_geo = false;
var timerAddGeo = 0;
var timerSentGeo = 0;

var addGeos = [];

$(document.ready = function(){
    $('.j-max-points input').val(max_points);

    data = {
        url: '/user/watching?token=' + _token
    };

    $.post('/curl.php', data, function (data) {
        if (undefined == data.users) {
            showLogin();
            return false;
        }

        for(key in data.users) {
            if (data.users[key].approved) {
                $('#i-watching-sep').after('<li class="j-friend-item" data-id="' + data.users[key].user_id + '" onclick="return setFriend(this);"><a href="#">' + data.users[key].name + '</a></li>');
            }
        }

        for(key in data.users) {
            if (! data.users[key].approved) {
                $('#i-watching-not-sp-sep').after('<li class="j-friend-item disabled" data-id="' + data.users[key].user_id + '" onclick="return false;"><a href="#">' + data.users[key].name + '</a></li>');
            }
        }

        data = {
            url: '/user/aboutme?token=' + _token
        };

        $.post('/curl.php', data, function (data) {
            selfId = data.user.id;
            $('#head-user-name').html(data.user.name);
            $('.j-my-trac-btn').removeClass('hidden');
            currrent_user = selfId;
            setMyTrac();
        });
        
        if(_remember) {
            // обновляем токен
            data = {
                url: '/user/refresh?token=' + _token
            };
            $.post('/curl.php', data, function (data) {
                _token = data.token;
                $.cookie('_token', _token, {expires: 30});
            });
        }
    });

    $('.j-my-trac-btn').on('click', function(){
        setMyTrac();
    });

    $('.j-max-points button').on('click', function () {
        max_points = parseInt($('.j-max-points input').val());
        showMap(currrent_user);
    });

    $('.j-change-map').on('click', function(){
        $('.j-change-map').removeClass('active');
        $(this).addClass('active');
        current_map = $(this).attr('data-view');
        showMap(currrent_user);
    });

    if (supportGeo()) {
        support_geo = true;
        $('.j-set-geo').removeClass('hidden');

        $('.j-set-geo').on('click', function(){
            if (sent_geo) {
                clearInterval(timerAddGeo);
                clearInterval(timerSentGeo);
                sent_geo = false;
                $('.j-set-geo a').html('<i class="glyphicon glyphicon-map-marker"></i> Отправлять гео-данные');
            } else {
                sent_geo = true;
                $('.j-set-geo a').html('<i class="glyphicon glyphicon-off"></i> Остановить отправку');

                timerAddGeo = setInterval(function () {
                    addGeo();
                }, 1000);

                timerSentGeo = setInterval(function () {
                    sentLocation();
                }, 60000);
            }
        });
    }
});

function setFriend(obj) {
    $('.j-my-trac-btn').removeClass('active');
    $('.j-friend-item').removeClass('active');
    $(obj).addClass('active');

    currrent_user = $(obj).attr('data-id');

    showMap(currrent_user);

    return false;
}

function setMyTrac()
{
    $('.j-my-trac-btn').addClass('active');
    $('.j-friend-item').removeClass('active');
    currrent_user = selfId;
    showMap(selfId);

    return false;
}

function showMap(userId)
{
    $('#friend_map').html('');

    if ('vector' == current_map) {
        return showMapVectors(userId);
    }

    data = {
        url: '/geo/points?token=' + _token,
        id: userId
    };

    $.post('/curl.php', data, function (data) {
        if (undefined == data.points) {
            showLogin();
            return false;
        }

        var points = [];

        var max = max_points - 1;

        if ((data.points.length - 1) < max) {
            max = data.points.length - 1;
        }

        for(var i=max; i>=0; i--) {
            points.push({
                geo: data.points[i].geo,
                lat: data.points[i].geo.replace(/^(.+),.+$/, '$1'),
                lan: data.points[i].geo.replace(/^.+,(.+)$/, '$1'),
                time: data.points[i].created_at,
                fromtime: data.points[i].fromtime,
                totime: data.points[i].totime
            });
        }

        var friend_map;

        ymaps.ready(function(){
            friend_map = new ymaps.Map("friend_map", {
                center: [points[points.length-1].lat, points[points.length-1].lan],
                zoom: 16
            });

            friend_map.controls.add('zoomControl');

            var cnt = 1;
            for(key in points) {
                if (points[key].fromtime == points[key].totime) {
                    var ballon = points[key].lat + ', ' + points[key].lan + ' (' + points[key].fromtime + ')';
                } else {
                    var ballon = points[key].lat + ', ' + points[key].lan + ' (' + points[key].fromtime + ' - ' + points[key].totime + ')';
                }

                myGeoObject = new ymaps.GeoObject({
                    geometry: {
                        type: "Point",// тип геометрии - точка
                        coordinates: [points[key].lat, points[key].lan] // координаты точки
                    },
                    properties: {
                        iconContent: cnt,
                        balloonContent: ballon
                    }
                });

                friend_map.geoObjects.add(myGeoObject);
                cnt++;
            }
        });
    });
}

function showMapVectors(userId)
{
    data = {
        url: '/geo/vectors?token=' + _token,
        id: userId
    };

    $.post('/curl.php', data, function (data) {
        if (undefined == data.points) {
            showLogin();
            return false;
        }

        var points = [];

        var max = max_points - 1;

        if ((data.points.length - 1) < max) {
            max = data.points.length - 1;
        }

        for(var i=data.points.length - 1 - max; i<=data.points.length - 1; i++) {
            points.push({
                geo: data.points[i].geo,
                lat: data.points[i].geo.replace(/^(.+),.+$/, '$1'),
                lon: data.points[i].geo.replace(/^.+,(.+)$/, '$1'),
                stay: data.points[i].stay,
                fromtime: data.points[i].fromtime,
                totime: data.points[i].totime
            });
        }

        var friend_map;

        ymaps.ready(function(){
            friend_map = new ymaps.Map("friend_map", {
                center: [points[points.length-1].lat, points[points.length-1].lon],
                zoom: 16
            });

            friend_map.controls.add('zoomControl');

            // добавление линий на карту
            var pps = [];
            var cnt = 1;
            for(key in points) {
                var ballon = '';
                var ballonFooter = '';
                // первую и последнюю точку отмечаем специальными значками если это не остановки
                if (points[key].stay == 0 && (key == 0 || key == points.length-1)) {
                    if (0 == key) {
                        ballon = 'Начало маршрута';
                        ballonFooter = points[key].fromtime;
                    } else {
                        ballon = 'Конец маршрута';
                        ballonFooter = points[key].totime;
                    }

                    myGeoObject = new ymaps.GeoObject({
                        geometry: {
                            type: "Point",// тип геометрии - точка
                            coordinates: [points[key].lat, points[key].lon] // координаты точки
                        },
                        properties: {
                            balloonContent: ballon,
                            balloonContentFooter: ballonFooter
                        }
                    }, {
                        iconImageHref: '/i/ig.png',
                    });

                    friend_map.geoObjects.add(myGeoObject);
                    cnt++;
                }

                pps.push([
                    points[key].lat,
                    points[key].lon
                ]);


                if (points[key].stay > 0) {
                    if (points[key].stay < 120) {
                        ballon = 'Остановка: ' + getFormatTime(points[key].stay);
                    } else {
                        ballon = 'Стоянка: ' + getFormatTime(points[key].stay);
                    }

                    ballonFooter = points[key].totime;

                    myGeoObject = new ymaps.GeoObject({
                        geometry: {
                            type: "Point",// тип геометрии - точка
                            coordinates: [points[key].lat, points[key].lon] // координаты точки
                        },
                        properties: {
                            iconContent: cnt,
                            balloonContent: ballon,
                            balloonContentFooter: ballonFooter
                        }
                    });

                    friend_map.geoObjects.add(myGeoObject);
                    cnt++;
                }

            }

            // https://tech.yandex.ru/maps/doc/jsapi/2.0/ref/reference/Polyline-docpage/
            // Создаем ломаную линию.
            var polyline = new ymaps.Polyline(pps, {
                hintContent: "Маршрут"
            }, {
                draggable: false,
                strokeStyle: 'solid',
                strokeColor: '#f00',
                strokeWidth: 4,
                opacity: 0.6
            });
            // Добавляем линию на карту.
            friend_map.geoObjects.add(polyline);
            // Устанавливаем карте границы линии.
            friend_map.setBounds(polyline.geometry.getBounds());
        });
    });
}

function getFormatTime (time) {
    var second = time % 60;
    var minute = Math.floor(time / 60) % 60;
    var hour = Math.floor(time / 3600) % 60;

    second = (second < 10) ? '0'+second : second;
    minute = (minute < 10) ? '0'+minute : minute;
    hour = (hour < 10) ? '0'+hour : hour;

    return hour + ':' + minute + ':' + second;
}

function addGeo()
{
    if (! sent_geo) {
        return false;
    }

    navigator.geolocation.getCurrentPosition(function (position) {
        addGeos.push({
            time: Math.floor(Date.now() / 1000),
            geo: position.coords.latitude + ', ' + position.coords.longitude
        });
    });
}

function sentLocation() {
    if (! sent_geo) {
        return false;
    }

    var sentGeos = JSON.stringify(addGeos);
    addGeos = [];

    data = {
        url: '/geo/package?token=' + _token,
        time: Math.floor(Date.now() / 1000),
        geos: sentGeos
    };

    $.post('/curl.php', data, function (data) {
        // @todo если отправка неудачная, нужно отправлять повторно
    }, 'json');
}

function supportGeo() {
    return !!navigator.geolocation;
}
