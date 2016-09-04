/**
 * Created by gleb on 04.09.2016.
 */
$(document.ready = function(){
    $('.j-btn-login').on('click', function(){
        var data = {
            url: 'http://31.184.195.194/api/v1/login',
            phone: $('#inputPhone').val(),
            password: $('#inputPassword').val()
        };

        if (! data.phone || !data.password) {
            return false;
        }


        $.post('/curl.php', data, function (data) {
            _token = data.token;
            $.cookie('_token', _token, {expires: 10});
            showMain();
        }, 'json')

        return false;
    });
});