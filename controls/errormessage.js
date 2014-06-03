define('audio-control-error-message', ['dr-widget-media-dom-helper'], function (DomHelper) {
    /*jshint mootools:true*/
    'use strict';

    var ErrorMesage = function (message, details) {

        var self = this;

        self.message = message;
        self.details = details;

        self.element = DomHelper.newElement('div', { 'class': 'dr-infobox' });

        var close = DomHelper.newElement('a', { 'href': '#', 'class': 'dr-icon-close-boxed close', 'title': 'luk', 'text': 'luk' }),
            headline = DomHelper.newElement('h1', { 'class': 'dr-icon-info-boxed', 'text': 'Der er sket en fejl' }),
            text = DomHelper.newElement('p');
        text.innerHTML = message;

        self.element.appendChild(close);
        self.element.appendChild(headline);
        self.element.appendChild(text);

        if (details) {
            self.element.appendChild(DomHelper.newElement('pre', { 'text': details }));
        }

        DomHelper.on(close, 'click', onClose);

        function onClose () {
            self.element.style.display = 'none';
        }

        // <div id="new-design-feedback" class="dr-infobox dr-siteid-tv">
        //     <a href="#" class="dr-icon-close-boxed close" title="Luk">Luk</a>
        //     <h1 class="dr-icon-info-boxed">Lorem ipsum dolor sit amet consectetur</h1>
        //     <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. <a href="#" class="section-link" title="Læs mere">Læs mere</a></p>
        // </div>

        return self.element;

    };

    return ErrorMesage;
});
