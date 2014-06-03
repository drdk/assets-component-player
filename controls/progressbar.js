define('audio-control-progressbar', ['dr-widget-media-dom-helper'], function (DomHelper) {

    /*jshint mootools:true*/
    'use strict';

    var ProgressBar = function (model) {

        var self = this,
            isDragging = false,
            isEventsInitialized = false;

        self.model = model;
        self.element = DomHelper.newElement('div', {'class': 'progressbar'});

        var textDiv = DomHelper.newElement('div', {'class': 'text'}),
            labelStart = DomHelper.newElement('span', {'class': 'label', text: self.model.options.videoData.formattedstarttime || '00:00'}),
            labelCurrent = DomHelper.newElement('span', { 'class': 'label position', text: '00:00' }),
            labelEnd = DomHelper.newElement('span', { 'class': 'label', text: self.model.options.videoData.formattedendtime || '00:00' }),
            meter = DomHelper.newElement('div', {'class': 'meter'});
        textDiv.appendChild(labelStart);
        textDiv.appendChild(labelCurrent);
        textDiv.appendChild(labelEnd);
        self.element.appendChild(textDiv);
        self.element.appendChild(meter);

        if (self.model.options.videoData.videoType === "live") {
            DomHelper.addClass(self.element, 'live');
        }


        self.model.addEvent('durationChange', onDurationChange);
        self.model.addEvent('afterSeek', update);
        self.model.addEvent('progressChange', update);
        self.model.addEvent('durationChange', initializeEvents);

        function onDurationChange () {
            if (labelEnd.textContent) {
                labelEnd.textContent = self.model.timeCodeConverter.secondsToTimeCode(self.model.duration());
            } else {
                labelEnd.innerText = self.model.timeCodeConverter.secondsToTimeCode(self.model.duration());
            }
            update();
        }
        function update () {
            if (!self.isDragging) {
                var p = isFinite(self.model.progress()) ? self.model.progress() : 0;
                if(self.model.options.videoData.videoType !== "live"){
                    if (labelStart.textContent) {
                        labelStart.textContent = self.model.timeCodeConverter.secondsToTimeCode(self.model.position());
                    } else {
                        labelStart.innerText = self.model.timeCodeConverter.secondsToTimeCode(self.model.position());
                    }
                    meter.style.width = ((p ? p : 0) * 100) + '%';
                }
            }
        }
        function initializeEvents () {
            if (!self.isEventsInitialized) {
                DomHelper.on(self.element, (self.model.isTouch ? 'touchstart' : 'mousedown'), startDrag);
                DomHelper.on(self.element, 'mousemove', handleToolTipEvents);
                DomHelper.on(self.element, 'mouseover', handleToolTipEvents);
                DomHelper.on(self.element, 'mouseout', handleToolTipEvents);
                self.isEventsInitialized = true;
            }
        }
        function startDrag (event) {
             var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            if (getMousePosition(e)) {
                document.addEvent((self.model.isTouch ? 'touchend' : 'mouseup'), stopDrag);
                document.addEvent((self.model.isTouch ? 'touchmove' : 'mousemove'), drag);
                labelCurrent.style.display = 'block';
                self.isDragging = true;
                drag(e);
            }
        }
        function drag (event) {
            var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            var progress = getMousePosition(e);
            if (progress) {
                meter.style.width = (progress * 100) + '%';
                labelCurrent.style.left = (progress * self.element.offsetWidth - 30) + 'px';
                if (labelCurrent.textContent) {
                    labelCurrent.textContent = self.model.timeCodeConverter.progressToTimeCode(progress, self.model.duration());
                } else {
                    labelCurrent.innerText = self.model.timeCodeConverter.progressToTimeCode(progress, self.model.duration());
                }
            }
            self._dragPosition = progress;
        }
        function stopDrag (event) {
            var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            self.isDragging = false;
            var pos = self._dragPosition;
            if (pos) {
                self.model.seek(pos);
            }
            self.element.getElement('.text span.position').setStyle('display', 'none');
            labelCurrent.style.display = 'none';
            DomHelper.off(document, (self.model.isTouch ? 'touchend' : 'mouseup'), stopDrag);
            DomHelper.off(document, (self.model.isTouch ? 'touchmove' : 'mousemove'), drag);
        }
        function handleToolTipEvents (event) {
            var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }

            if (self.isDragging) {
                return;
            }
            switch (e.type) {
                case 'mouseover':
                    if (getMousePosition(e)) {
                        labelCurrent.style.display = 'block';
                    }
                    break;
                case 'mouseout':
                    labelCurrent.style.display = 'none';
                    break;
                case 'mousemove':
                    var pos = getMousePosition(e);
                    if (pos) {
                        labelCurrent.style.left = (pos * self.element.offsetWidth - 30) + 'px';
                        if (labelCurrent.textContent) {
                            labelCurrent.textContent = self.model.timeCodeConverter.progressToTimeCode(pos, self.model.duration());
                        } else {
                            labelCurrent.innerText = self.model.timeCodeConverter.progressToTimeCode(pos, self.model.duration());
                        }
                    }
                    break;
            }
        }
        function getMousePosition (event) {
            var bounds = self.element.getBoundingClientRect(),
                x = 0;
            if (event.type === 'touchend') {
                x = event.changedTouches[0].screenX;
            } else if (event.pageX) {
                x = event.pageX;
            } else {
                x = event.clientX;
            }
            if (x > bounds.right) {
                return false;
            }
            return Math.max(0, (x - bounds.left) / (bounds.right - bounds.left));
        }

        return self.element;
    }

    return ProgressBar;
});
