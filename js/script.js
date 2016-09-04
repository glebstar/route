var _token = false;

$(document.ready = function(){
    _token = $.cookie('_token');

    if (undefined == _token || ! _token || 'false' ==  _token) {
        // show login
        showLogin();
    } else {
        showMain();
    }
});

function showMain() {
    $('#body').load('../tpl/main.html?v=' + script_version);
    $('body').append('<script src="/js/main.js?v=' + script_version + '"></script>');
}

function showLogin() {
    $('#body').load('../tpl/login.html?v=' + script_version);
    $('body').append('<script src="/js/login.js?v=' + script_version + '"></script>');
}

function logout() {
    _token = false;
    $.cookie('_token', _token, {expires: 10});
    window.location.href = '/';
}