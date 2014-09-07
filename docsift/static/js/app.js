$(function() {
    var $sidebar = $('#sidebar'),
        sidebarContent = $sidebar.html();

    var $results = $('.result');

    var loadDetails = function(collection, document) {
        var req = $.get('/collections/' + collection + '/document/' + document + '?snippet=true');
        req.done(function(html) {
            console.log('snippet!');
            $sidebar.html(html);
        });
    };

    $('.result').mouseenter(function(e) {
        var $el = $(e.currentTarget);
        $sidebar.html(sidebarContent);
        loadDetails($el.data('collection'), $el.data('hash'));
        $results.removeClass('active');
        $el.addClass('active');
    });
    $('.result').mouseleave(function(e) {
        var $el = $(e.currentTarget);
        //$el.removeClass('active');
    });

});
