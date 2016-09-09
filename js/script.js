var _token = false;
var _remember = false;
var selfId = 0;

$(document.ready = function(){
    _remember = $.cookie('_remember');
    if (undefined == _remember || 'non' == _remember) {
        _remember = false;
    }

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
    _remember = false;

    $.cookie('_token', _token, {expires: 30});
    $.cookie('_remember', 'non', {expires: 30});
    window.location.href = '/';
}
