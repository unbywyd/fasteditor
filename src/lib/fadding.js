export default function() {
    var fadding = {};

    function animateOverTime(dur, cb, fin) {
        var timeStart;
        function _animateOverTime(time) {
            if (!timeStart) timeStart = time;
            var timeElapsed = time - timeStart;
            var completion = Math.min(timeElapsed / dur, 1);

            cb(completion);

            if (timeElapsed < dur) {
                requestAnimationFrame(_animateOverTime);
            } else {
                if (typeof fin === 'function') fin();
            }
        };

        return _animateOverTime;
    }

    fadding.fadeOut = function(dur, fin) {
        this.each(function() {
            let el = this;
            var _fadeOut = function(completion) {
                el.style.opacity = 1 - completion;
                if (completion === 1) {
                    el.style.display = 'none';
                }
            }

            var ani = animateOverTime(dur, _fadeOut, fin);
            requestAnimationFrame(ani);
        });
    }

    fadding.fadeIn = function(dur, display, fin) {
        this.each(function() {
            let el = this;
            el.style.display = display || 'block';
            var _fadeIn = function(completion) {
                el.style.opacity = completion;
            };

            var ani = animateOverTime(dur, _fadeIn, fin);
            requestAnimationFrame(ani);
        });
    }

    return fadding;
}