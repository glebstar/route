/**
 * Created by gleb on 04.09.2016.
 */
$(document.ready = function(){
    data = {
        url: 'http://31.184.195.194/api/v1/user/watching?token=' + _token,
    };

    $.post('/curl.php', data, function (data) {
        if (undefined == data.users) {
            showLogin();
            return false;
        }
        for(key in data.users) {
            if (data.users[key].approved) {
                $('.j-lbl-friends').removeClass('hidden');
                $('.j-friends').append('<a href="#" class="list-group-item j-friend-item" data-id="' + data.users[key].user_id + '" onclick="return setFriend(this);">' + data.users[key].name + '</a>');
            }
        }

        for(key in data.users) {
            if (! data.users[key].approved) {
                $('.j-lbl-friends-not-ap').removeClass('hidden');
                $('.j-friends-not-ap').append('<a href="#" class="list-group-item j-friend-item disabled" data-id="' + data.users[key].user_id + '">' + data.users[key].name + '</a>');
            }
        }
    });
});

function setFriend(obj) {
    $('.j-friend-item').removeClass('active');
    $(obj).addClass('active');

    $('#first_map').html('');

    data = {
        url: 'http://31.184.195.194/api/v1/geo/points?token=' + _token,
        id: $(obj).attr('data-id')
    };

    $.post('/curl.php', data, function (data) {
        var points = [];

        for(i=2; i>=0; i--) {
            points.push({
                geo: data.points[i].geo,
                lat: data.points[i].geo.replace(/^(.+),.+$/, '$1'),
                lan: data.points[i].geo.replace(/^.+,(.+)$/, '$1')
            });
        }

        /*
        for(key in data.points) {
            points.push({
                geo: data.points[key].geo,
                lat: data.points[key].geo.replace(/^(.+),.+$/, '$1'),
                lan: data.points[key].geo.replace(/^.+,(.+)$/, '$1')
            });
        }
        */

        var friend_map;

        ymaps.ready(function(){
            friend_map = new ymaps.Map("first_map", {
                center: [points[0].lat, points[0].lan],
                zoom: 16
            });
        });

        var route = [];

        for(key in points) {
            route.push([
                points[key].lat,
                points[key].lan
            ]);
            /*
            myGeoObject = new ymaps.GeoObject({
                geometry: {
                    type: "Point",// тип геометрии - точка
                    coordinates: [points[key].lat, points[key].lan] // координаты точки
                }
            });
            friend_map.geoObjects.add(myGeoObject);
            */
        }

        ymaps.route(route).then(
            function (route) {
                friend_map.geoObjects.add(route);
            },
            function (error) {
                alert("Возникла ошибка: " + error.message);
            }
        );
    });

    return false;
}