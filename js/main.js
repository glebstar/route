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
var lastSentTime = 0;
var wakeLock;

var animSent = false;

var addGeos = [];

var filterfromtimeinput;
var filtertotimeinput;
var filterfromtime = null;
var filtertotime = null;

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
                $('#i-watching-sep').after('<li class="j-friend-item" data-id="' + data.users[key].id + '" onclick="return setFriend(this);"><a href="#">' + data.users[key].name + '</a></li>');
            }
        }

        for(key in data.users) {
            if (! data.users[key].approved) {
                $('#i-watching-not-sp-sep').after('<li class="j-friend-item disabled" data-id="' + data.users[key].id + '" onclick="return false;"><a href="#">' + data.users[key].name + '</a></li>');
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

        // получение списка "За мной наблюдают"
        data = {
            url: '/user/watchingme?token=' + _token
        };

        $.post('/curl.php', data, function (data) {
            for(key in data.users) {
                if (data.users[key].approved) {
                    $('#watching-me-list').append('<li class="disabled"><a href="#" onclick="return false;">' + data.users[key].name + '</a></li>');
                }
            }
        });
    });

    $('.j-my-trac-btn').on('click', function(){
        setMyTrac();
    });

    $('.j-max-points button').on('click', function () {
        max_points = parseInt($('.j-max-points input').val());
        filterfromtimeinput.val('');
        filtertotimeinput.val('');
        filterfromtime = null;
        filtertotime = null;

        showMap(currrent_user);
    });

    $('.j-change-map').on('click', function(){
        $('.j-change-map').removeClass('active');
        $('.j-show-log').removeClass('active');
        $(this).addClass('active');
        current_map = $(this).attr('data-view');
        showMap(currrent_user);
    });

    if (supportGeo()) {
        support_geo = true;
        $('.j-set-geo').removeClass('hidden');
        $('.j-show-log').removeClass('hidden');

        $('.j-set-geo, .j-anim-sent').on('click', function(){
            if (sent_geo) {
                //clearInterval(timerAddGeo);
                navigator.geolocation.clearWatch(timerAddGeo);
                if (undefined != wakeLock) {
                    wakeLock.unlock();
                }
                //clearInterval(timerSentGeo);
                sent_geo = false;
                $('.j-set-geo a').html('<i class="glyphicon glyphicon-map-marker"></i> Отправлять гео-данные');
                $('.j-anim-sent a').attr('title', 'Гео-данные не передаются');
                $('.j-anim-sent a i.glyphicon').removeClass('glyphicon-signal').addClass('glyphicon-ban-circle');
                $('.j-anim-sent a').css('color', '#9d9d9d');

                // передать оставшиеся точки
                sentLocation();
            } else {
                sent_geo = true;
                lastSentTime = Math.floor(Date.now() / 1000);
                $('.j-set-geo a').html('<i class="glyphicon glyphicon-off"></i> Остановить отправку');
                $('.j-anim-sent a').attr('title', 'Гео-данные передаются');
                $('.j-anim-sent a i.glyphicon').removeClass('glyphicon-ban-circle').addClass('glyphicon-signal');
                $('.j-anim-sent a').css('color', '#fff');

                var supportsWakeLock = "requestWakeLock" in navigator;
                if (supportsWakeLock) {
                    wakeLock = navigator.requestWakeLock('gps');
                    var date = new Date();
                    $('.log-title').after('<p><span class="label label-success"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : Работа в режиме блокировки возможна</p>');
                } else {
                    var date = new Date();
                    $('.log-title').after('<p><span class="label label-warning"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : navigator.requestWakeLock не определена</p>');
                }

                timerAddGeo = navigator.geolocation.watchPosition(function (position) {
                    var coord = position.coords.latitude + ', ' + position.coords.longitude;
                    var currentTime = Math.floor(Date.now() / 1000);
                    addGeos.push({
                        time: currentTime,
                        geo: coord
                    });
                    var date = new Date();
                    $('.log-title').after('<p><span class="label label-primary"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : ' + coord  + '</p>');

                    // анимация сбора данных
                    if (animSent) {
                        animSent = false;
                        $('.j-anim-sent a').css('color', '#9d9d9d');
                    } else {
                        animSent = true;
                        $('.j-anim-sent a').css('color', '#fff');
                    }

                    // отправка данных на сервер в заблокированном режиме.
                    if ((currentTime - lastSentTime) >= 120) {
                        sentLocation();
                    }

                }, function(e){
                    $('.log-title').after('<p><span class="label label-danger"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : ' + e.message  + '</p>');
                    return false;
                }, {
                    enableHighAccuracy: true,
                    maximumAge: 0
                });

                timerSentGeo = setInterval(function () {
                    sentLocation();
                }, 60000);
            }
        });

        $('.j-show-log').on('click', function(){
            $('.j-change-map').removeClass('active');
            $('.j-show-log').addClass('active');
            $('#friend_map').html($('#radar-log').html());
        });
    }

    // датапикеры
    $.datetimepicker.setLocale('ru');
    filterfromtimeinput = $('#j-dt-from').datetimepicker();
    filtertotimeinput   = $('#j-dt-to').datetimepicker();
});

function setFriend(obj) {
    $('.j-my-trac-btn').removeClass('active');
    $('.j-friend-item').removeClass('active');
    $(obj).addClass('active');

    $('.j-change-map').removeClass('active');
    $('.j-show-log').removeClass('active');
    if ('vector' == current_map) {
        $('.j-change-map-vector').addClass('active');
    } else {
        $('.j-change-map-point').addClass('active');
    }

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

    if (filterfromtime) {
        data.from = filterfromtime;
    }

    if (filtertotime) {
        data.to = filtertotime;
    }

    $.post('/curl.php', data, function (data) {
        if (undefined == data.points) {
            showLogin();
            return false;
        }

        if (0 == data.points.length) {
            // нет данных
            $('#friend_map').html('<h3><span class="label label-info">Нет данных для данного пользователя и установленного фильтра</span></h3><p style="margin-top: 20px;"><img src="/i/logo.png"> </p>');
            return false;
        }

        var points = [];

        var max = max_points - 1;
        if (filterfromtime || filtertotime) {
            max = 20000;
        }

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

    if (filterfromtime) {
        data.from = filterfromtime;
    }

    if (filtertotime) {
        data.to = filtertotime;
    }

    $.post('/curl.php', data, function (data) {
        if (undefined == data.points) {
            showLogin();
            return false;
        }

        if (0 == data.points.length) {
            // нет данных
            $('#friend_map').html('<h3><span class="label label-info">Нет данных для данного пользователя и установленного фильтра</span></h3><p style="margin-top: 20px;"><img src="/i/logo.png"> </p>');
            return false;
        }

        var points = [];

        var max = max_points - 1;
        if (filterfromtime || filtertotime) {
            max = 20000;
        }

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

                    /*
                    var myCircle = new ymaps.Circle([
                        // Координаты центра круга.
                        [points[key].lat, points[key].lon],
                        // Радиус круга в метрах.
                        20
                    ], {
                        // Описываем свойства круга.
                        // Содержимое балуна.
                        balloonContent: ballon,
                        balloonContentFooter: ballonFooter,
                    }, {
                        // Задаем опции круга.
                        // Включаем возможность перетаскивания круга.
                        draggable: false,
                        // Цвет заливки.
                        // Последний байт (77) определяет прозрачность.
                        // Прозрачность заливки также можно задать используя опцию "fillOpacity".
                        fillColor: "#f00",
                        fillOpacity: 0.9,
                        // Цвет обводки.
                        strokeColor: "#fff",
                        // Прозрачность обводки.
                        //strokeOpacity: 0.6,
                        // Ширина обводки в пикселях.
                        strokeWidth: 2
                    });

                    friend_map.geoObjects.add(myCircle);
                    */

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

function sentLocation() {
    if (! sent_geo && addGeos.length == 0) {
        clearInterval(timerSentGeo);
        var date = new Date();
        $('.log-title').after('<p><span class="label label-warning"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : <b>Отправка остановлена</b></p>');
        return false;
    }

    if (addGeos.length == 0) {
        var date = new Date();
        $('.log-title').after('<p><span class="label label-warning"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : <b>Отправлять нечего...</b></p>');
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

        var date = new Date();
        if (undefined != data.result) {
            $('.log-title').after('<p><span class="label label-success"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : <b>Успешная отправка на сервер</b></p>');
            var supportsVibrate = "vibrate" in navigator;
            if (supportsVibrate) {
                navigator.vibrate(1200);
            }
            lastSentTime = Math.floor(Date.now() / 1000);
        } else {
            $('.log-title').after('<p><span class="label label-danger"> ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' </span> : <b>Ошибка отправки на сервер</b></p>');
        }
    }, 'json');
}

function supportGeo() {
    return !!navigator.geolocation;
}

function setTimeFilter() {
    var from = filterfromtimeinput.datetimepicker('getValue');
    if (from) {
        filterfromtime = Math.floor(from.getTime() / 1000);
    }

    var to = filtertotimeinput.datetimepicker('getValue');
    if (to) {
        filtertotime = Math.floor(to.getTime() / 1000);
    }

    showMap(currrent_user);

    return false;
}
