


# FastEditor
This is a very simple jQuery/CashDom plugin for editing content on a page, size of plugin 10kb without frameworks.
It requires Jquery or CashDom, plugin is suitable for use with requirejs

![fasteditor](https://ungic.com/fasteditor/fasteditor.jpg)

## Features:
* Dynamically binding controls to elements
* Attribute binding (e.g. date-id)
* Text editing
* Works on promises
* It supports nested initialization of plugins

## Get started:

Just include it to your project
```html
// With jquery
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="/fasteditor.min.js"></script>

// With CashDom
<script src="https://cdnjs.cloudflare.com/ajax/libs/cash/7.0.1/cash.min.js"></script>
<script src="/fasteditor.min.js"></script>

// As require js plugin
define(['jquery', 'fasteditor'], function($) {
    //...
});
```
To initialize, use
```javascript
$el.fastEditor(options);
```
Options:
| Option name      |      Default value      |  Description |
|------------------|:-----------------------:|-------------:|
| attr                | data-id | Returns the value of this attribute after the action (If the elements do not contain this attribute, then it will be created dynamically)                      |
| controlsPosition    | top     |   The place where controls will be added (top - prepend, bottom - append) |
| editMode            | true    |  activate edit mode? (It is required to specify a selector of elements that can be changed. See next parameter) |
| editElementSelector | .edit-it | selector of elements that can be changed |
| controls | [] | Array of controls (See below about controls) |
| successTimeout | 500 | Visual delay after successful action |
| elementPreHandler | (el, data, parentNode) => el | Handler of controls before adding to the page |

### About controls

Object of control should be as follows:
| Key              |      Value              |
|------------------|:-----------------------:|
| key | button |
| label | Remove |
| action | remove |
| class | remove-item-btn |


Pseudo events and workers
After plugin initialization need to access them as follows:
```javascript
let plugin = $el.fastEditor({..});
let { workers, emitter } = plugin;
```

Workers and emitter are ordinary objects. The purpose of the emitter is to simply notify, but workers are action handlers and must return a promise. If a worker for the action was not created, then the action will be performed without errors and nothing will happen.


Examples:
```javascript
let plugin = $('.item').fastEditor({
    editMode: true,
    controlsPosition: 'bottom',
    editElementSelector: '.edit-it',
    controls: [{
        tag: 'button',
        label: 'Remove',
        action: 'remove',
        class: 'remove-item-btn'
    }],
});
if (plugin) {
    let { workers, emitter } = plugin;
    workers.remove = function(data) {
        /*
        *  data of control contains the following:
        *       id (The attribute that is specified in the settings)
        *       node (Node of active control)
        *       parentNode (The element on which the plugin was initialized)
        */
        return new Promise((res, rej) => {
            // Pseudo request (Send new data to server)
            setTimeout(function() {
                let $el = $(data.parentNode);
                $el.fadeOut(300, () => {
                    $el.remove();
                });
                res();
            }, 1000);
        });
    }
    workers.edit = function(data) {
        /*
        *  data of edit control contains the following:
        *       id (The attribute that is specified in the settings)
        *       parentId (ID of the element on which the plugin was initialized)
        *       node (Node of active pseudo field)
        *       parentNode (The element on which the plugin was initialized)
        *       prevContent (Previous Content)
        *       content (Actual content)
        */
        return new Promise((res, rej) => {
            // Pseudo request (Send new data to server)
            setTimeout(function() {
                res();
            }, 1000);
        });
    }
    // Events
    emitter.all = function(event, data) {
        console.log(event + ' event is coming', data);
    }
    // For a specific event
    emitter.do = function(data) {
        console.log('Do event', data);
    }
}
```

#### Stage of action
Stages of the controls:
* After the action has been started, the loading stage begins, **__fasteditor-loading** class is assigned to the element.
* After receiving a response from the worker, **__fasteditor-success**  class is assigned to the element, but for a period of time (See successTimeout option of plugin)
* After disabling the plugin, **__fasteditor-disabled**  class is assigned to the element.

Stages of the editors:
* After an element is activated for editing, **__fasteditor-editable** class is assigned to the element.
* When an element loses focus and changes have been made, **__fasteditor-loading** class is assigned to the element.
* After receiving a response from the worker, **__fasteditor-success**  class is assigned to the element, but for a period of time (See successTimeout option of plugin)

## Methods

After initialization, the following methods are available:

| Method           |  Desc           |
|------------------|:---------------:|
| enable           |  Enable plugin  |
| disable          |  Disable plugin |
| destroy          |  Safely destroy |

Example for use:

```
$('.item').fastEditor('destroy');
```

## Demo
The working demo version is in the package and [at the link](https://ungic.com/fasteditor/)

## Links

NPM - **npm install fasteditor**

If you have questions, contact me! Thks!

Author [unbywyd](https://unbywyd.com)
