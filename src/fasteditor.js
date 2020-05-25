import Fadding from './lib/fadding.js';

(function (factory) {
if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
} else {
    if('jQuery' in window) {
        factory(jQuery);
    } else if('cash' in window) {
        factory(cash);
    } else {
        console.warn('jQuery or cashDom are required');
    }
}
}(function($) {
    if(!$.fn.fadeOut) {
        let fadding = Fadding();
        $.fn = Object.assign($.fn, fadding);
    }
    let els = new Map;
    function Workers() {
        return {}
    }
    function Emitter() {
        return {}
    }
    function uniq() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    function eventer(el, options) {
        this.el = el;
        this.options = Object.assign({}, options);
    }
    eventer.prototype.emit = function(event, data) {
        if(this.emitter[event] && typeof this.emitter[event] == 'function') {
            data = Object.assign({}, data);
            data.parentNode = this.el;
            this.emitter[event](data);
        }
        if(this.emitter['all'] && typeof this.emitter['all'] == 'function') {
            this.emitter['all'](event, data);
        }
    }
    function worker(el, options) {
        this.el = el;
        this.options = Object.assign({}, options);
    }
    worker.prototype.do = function(action, data) {
        return new Promise((res, rej) => {
            if(this.workers[action]) {
                if(typeof this.workers[action] == 'function') {
                    data.parentNode = this.el;
                    let result = this.workers[action](data);
                    if(result instanceof Promise) {
                        result.then(function(e) {
                            res(e === undefined ? true : e);
                        }).catch(e => {
                            console.error(e);
                        });
                    } else {
                        res(result === undefined ? true : result);
                    }
                }
            } else {
                res(false);
            }
        });
    }

    function fasteditor(options, sys) {
        this.workers = sys.workers;
        this.emitter = sys.emitter;
        this.options = Object.assign({
            attr: 'data-id',
            controlsPosition: 'top',
            editMode: true,
            editElementSelector: '.edit-it',
            successTimeout: 500,
            controls: [],
            elementPreHandler: function(el, data, parentNode) {
                return el;
            }
        }, options);
    }
    fasteditor.prototype.init = function(el) {
        this.el = el;
        this.$controls = [];
        this.worker = new worker(this.el);
        this.worker.workers = this.workers;
        this.eventer = new eventer(this.el);
        this.eventer.emitter = this.emitter;
        if(!$(this.el).attr(this.options.attr)) {
            $(this.el).attr(this.options.attr, uniq());
        }
        this.id = $(this.el).attr(this.options.attr);

        if(Array.isArray(this.options.controls) && this.options.controls.length) {
            try {
                for(let control of this.options.controls) {
                    let controlElement = document.createElement(control.tag);
                    if('function' == typeof this.options.elementPreHandler) {
                        controlElement = this.options.elementPreHandler(controlElement, control, this.el);
                    }
                    let $control = $(controlElement);
                    $control.addClass('__fasteditor-control' + this.id).addClass(control.class || '');
                    $control.attr('data-fe-action', control.action).html(control.label);
                    this.$controls.push($control);
                }
            } catch(e) {
                console.error('Errors occurred while creating controls', e);
            }
        } else {
            console.warn('At least one control is required.');
        }

        if(this.options.editMode && $(this.el).find(this.options.editElementSelector).length) {
            let $editElements = $(this.el).find(this.options.editElementSelector);
            $editElements.addClass('__fasteditor-editor __fasteditor-editor' + this.id); //.attr('data-fe-action', 'edit');

            if($editElements.length) {
                for(let el of $editElements) {
                    let $el = $(el);
                    if(!$el.attr(this.options.attr)) {
                        $el.attr(this.options.attr, uniq());
                    }
                }
            }
        }

        this.controlsHandler = e => {
            e.preventDefault();
            if(this.disabled) {
                return
            }
            let $this = $(e.currentTarget), action = $this.attr('data-fe-action');
            if($this.data('fe-loading')) {
                return
            }
            $this.data('fe-loading', true);
            $this.addClass('__fasteditor-loading');
            let data = {
                id: this.id,
                parentNode: this.el,
                node: e.currentTarget
            }
            this.eventer.emit('do', action, data);
            this.worker.do(action, data).then(e => {
                $this.removeClass('__fasteditor-loading');
                $this.addClass('__fasteditor-success');
                setTimeout(function() {
                    $this.removeClass('__fasteditor-success');
                    $this.data('fe-loading', false);
                }, this.options.successTimeout);
            });
        }
        this.editableHandler = e => {
            e.preventDefault();
            if(this.disabled) {
                return
            }
            if(this.activeEditor && e.currentTarget != this.activeEditor.el) {
                $(document).trigger('click');
            }
            let $this = $(e.currentTarget), id = $this.attr(this.options.attr);
            $(document).on('blur.fe, focus.fe, click.fe', this.unfocusHandler);
            if($this.data('fe-editable')) {
                return
            }
            if($this.data('fe-loading')) {
                return
            }
            $this.data('fe-editable', true);
            $this.addClass('__fasteditor-editable');
            let content = $this.html();
            this.eventer.emit('do', 'startEdit', {
                id: this.id,
                parentNode: this.el,
                node: e.currentTarget,
                content
            });
            $this.attr('contenteditable', true);
            this.activeEditor = {
                el: e.currentTarget,
                content,
                id
            }
        }

        this.unfocusHandler = e => {
            e.preventDefault();
            if(this.activeEditor && this.activeEditor.el != e.target) {
                let activeEditor = this.activeEditor;
                let $this = $(activeEditor.el);
                delete this.activeEditor;
                $(document).off('blur.fe, focus.fe, click.fe', this.unfocusHandler);
                $this.data('fe-editable', false).attr('contenteditable', false).removeClass('__fasteditor-editable');
                let content = $this.html();

                if(content === activeEditor.content) {
                    return
                }
                let data = {
                    parentId: this.id,
                    id: activeEditor.id,
                    parentNode: this.el,
                    node: activeEditor.el,
                    prevContent: activeEditor.content,
                    content
                }

                $this.addClass('__fasteditor-loading');
                $this.data('fe-loading', true);
                this.eventer.emit('do', 'afterEdit', data);
                this.worker.do('edit', data).then(e => {
                    $this.removeClass('__fasteditor-loading');
                    $this.addClass('__fasteditor-success');
                    setTimeout(function() {
                        $this.removeClass('__fasteditor-success');
                        $this.data('fe-loading', false);
                    }, 1000);
                });
            }
        }
        $(this.el).on('click.fe', '.__fasteditor-control' + this.id, this.controlsHandler);
        $(this.el).on('click.fe', '.__fasteditor-editor' + this.id, this.editableHandler);


        this.$controlsBox = $('<div/>', {
            class: '__fasteditor-controls'
        });

        if(this.$controls.length) {
            for (let $el of this.$controls) {
                this.$controlsBox.append($el);
            }
        }


        if(this.options.controlsPosition == 'top') {
            $(this.el).prepend(this.$controlsBox);
        } else {
            $(this.el).append(this.$controlsBox);
        }

        $(this.el).addClass('__fasteditor-inited');
        this.enable();
        this.inited = true;
    }
    fasteditor.prototype.destroy = function() {
        this.inited = false;
        $(this.el).off('click.fe');
        $(document).off('blur.fe, focus.fe, click.fe', this.unfocusHandler);
        this.$controlsBox.remove();
        let classList = this.el.className.split(/\s+/);
        for(let className of classList) {
            if(className.indexOf('fasteditor') != -1) {
                this.el.classList.remove(className);
            }
        }
        if(this.options.editMode && $(this.el).find(this.options.editElementSelector).length) {
            let $editElements = $(this.el).find(this.options.editElementSelector);
            let classList = $editElements[0].className.split(/\s+/);
            for(let className of classList) {
                if(className.indexOf('fasteditor') != -1) {
                    $editElements.removeClass(className);
                }
            }
        }
        if(this.activeEditor) {
            $(document).trigger('click');
        }
        els.delete(this.el);
    }
    fasteditor.prototype.disable = function() {
        this.disabled = true;
        if(this.$controls.length) {
            for(let $control of this.$controls) {
                $control.attr('disabled', true);
            }
        }
        $(this.el).addClass('__fasteditor-disabled');
    }
    fasteditor.prototype.enable = function() {
        this.disabled = false;
        if(this.$controls.length) {
            for(let $control of this.$controls) {
                $control.removeAttr('disabled');
            }
        }
        $(this.el).removeClass('__fasteditor-disabled');
    }
    fasteditor.prototype.status = function() {
        return {
            disabled: this.disabled,
            inited: this.inited
        }
    }
    $.fn.fastEditor = function(method, options) {
        if(this.length) {
            if('string' == typeof method) {
                if(typeof fasteditor.prototype[method]) {
                    this.each(function() {
                        if(els.has(this)) {
                            els.get(this)[method](options);
                        } else {
                            console.warn(`The plugin was not initialized for this element`);
                        }
                    });
                } else {
                    console.error(`Method ${method} not exist`);
                }
            } else {
                let plugin;
                let emitter = new Emitter, workers = new Workers;
                this.each(function() {
                    if(!els.has(this)) {
                        plugin = new fasteditor(typeof method == 'object' ? method : {}, {
                            emitter, workers
                        });
                        plugin.init(this);
                        els.set(this, plugin);
                    }
                });
                return {
                    emitter, workers
                }
            }
        }
    }
}));




