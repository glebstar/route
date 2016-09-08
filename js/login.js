/**
 * Created by gleb on 04.09.2016.
 */
$(document.ready = function(){
    $('.j-btn-login').on('click', function(){
        var data = {
            url: '/login',
            phone: $('#inputPhone').val(),
            password: $('#inputPassword').val()
        };

        if ($('#inputRemember').prop("checked")) {
            _remember = true;
        } else {
            _remember = false;
        }

        if (! data.phone || !data.password) {
            return false;
        }


        $.post('/curl.php', data, function (data) {
            _token = data.token;
            if (_remember) {
                $.cookie('_token', _token, {expires: 10});
            } else {
                // запомнить на одну сессию
                $.cookie('_token', _token);
            }
            showMain();
        }, 'json')

        return false;
    });
});