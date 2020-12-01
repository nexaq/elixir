function parentsByClass(element, className) {
    let parent = element.parentElement;
    if (parent === document.body) {
        return null;
    }
    if (parent.classList.contains(className)) {
        return parent;
    }
    parentsByClass(parent, className);
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, {[key]: {}});
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {[key]: source[key]});
            }
        }
    }
    return mergeDeep(target, ...sources);
}

function wrap(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
}

function unwrap(wrapper) {
    let docFrag = document.createDocumentFragment();
    while (wrapper.firstChild) {
        let child = wrapper.removeChild(wrapper.firstChild);
        docFrag.appendChild(child);
    }
    wrapper.parentNode.replaceChild(docFrag, wrapper);
}

// ALERTS
let alertControl = (function () {
    let _alertElement = document.querySelector('.alert');
    if (!_alertElement) {
        return;
    }
    let _alertContainer = _alertElement.querySelector('.alert__container');
    let _alertInner = _alertElement.querySelector('.alert__inner');
    let _alertHeader = _alertElement.querySelector('.alert__header');
    let _alertBody = _alertElement.querySelector('.alert__body');
    let _alertFooter = _alertElement.querySelector('.alert__footer');

    function renderAlertButton(buttonOptions) {
        let button = document.createElement('button');
        button.textContent = buttonOptions.text;
        if (buttonOptions.behavior === 'submit') {
            button.type = 'submit';
        }
        if (buttonOptions.behavior === 'close') {
            button.addEventListener('click', this.closeAlert)
        }
        button.classList.add(...buttonOptions.classList);
        return button;
    }

    function closeAlert(e = undefined) {
        if (e !== undefined) {
            e.preventDefault();
        }
        _alertElement.classList.remove('alert_active');
    }

    function renderForm(formOptions) {
        let oldForm = _alertElement.querySelector('form');
        if (oldForm) {
            unwrap(oldForm);
        }

        if (formOptions) {
            let form = document.createElement('form');

            forms.run(form);

            form.setAttribute('method', formOptions.method ? formOptions.method : 'POST');
            form.setAttribute('action', formOptions.action);
            wrap(_alertInner, form);
        }

        _alertElement.addEventListener('click', (e) => {
            if (e.target === _alertContainer || _alertContainer.contains(e.target)) {
                return;
            }
            this.closeAlert();
        });
    }

    function showAlert(content, title, buttons = {}, formOptions = undefined) {
        let buttonsDefault = {
            accept: {
                text: 'ACCEPT',
                behavior: 'submit', // can be close/submit
                classList: ['app__button', 'alert__button_confirm'],
            },
            decline: {
                text: 'CANCEL',
                behavior: 'close',
                classList: ['app__button', 'alert__button_cancel', 'alert__button_danger'],
            }
        };

        buttons = mergeDeep(buttonsDefault, buttons);

        if (title === null || title === undefined) {
            _alertHeader.hidden = true;
        } else {
            _alertHeader.hidden = false;
            _alertHeader.textContent = title;
        }

        if (content === null || content === undefined) {
            _alertBody.hidden = true;
        } else {
            _alertBody.hidden = false;
            if (typeof content === 'string') {
                _alertBody.innerHTML = content;
            } else {
                _alertBody.innerHTML = '';
                _alertBody.append(content);
            }
        }

        let buttonAccept = renderAlertButton.call(this, buttons.accept);
        let buttonDecline = renderAlertButton.call(this, buttons.decline);

        _alertFooter.append(buttonAccept);
        _alertFooter.append(buttonDecline);

        let fragment = document.createDocumentFragment();

        renderForm(formOptions);

        // show alert
        _alertElement.classList.add('alert_active');
    }

    return {
        showAlert: showAlert,
        closeAlert: closeAlert,
    }
})();

// input animations
let formControl = (function () {
    function checkFocus() {
        let formControl = parentsByClass(this, 'form-control');

        formControl.classList.remove('form-control_focused');

        if (this.value !== '') {
            formControl.classList.add('form-control_filled');
        } else {
            formControl.classList.remove('form-control_filled');
        }
    }

    function runOnInput(formControl) {
        let input = formControl.querySelector('.form-control__input');

        input.addEventListener('focus', function () {
            formControl.classList.add('form-control_focused');
        });

        checkFocus.call(input);
        input.addEventListener('focusout', checkFocus.bind(input));
    }

    function runOnAll(context = null) {
        context = context ? context : document;
        let formControls = context.querySelectorAll('.form-control');
        Array.from(formControls).forEach((formControl) => runOnInput(formControl));
    }

    runOnAll();

    return {
        runOnInput: runOnInput,
        runOnAll: runOnAll
    };
})();

// on form submit
let forms = (function () {
    let forms = document.querySelectorAll('form');

    function run(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let inputs = form.querySelectorAll('input, textarea')
            let data = {};

            Array.from(inputs).forEach((input) => {
                data[input.getAttribute('name')] = input.value;
            })
            console.log(data)
        })
    }

    function runOnAll() {
        Array.from(forms).forEach((form) => run(form));
    }
    runOnAll();

    return {
        run: run,
        runOnAll: runOnAll,
    }
})();

// profile alerts
(function () {
    let profileTable = document.querySelector('.edit-profile__name-value-table');
    if (!profileTable) {
        return;
    }
    let profileSettingsItems = profileTable.querySelectorAll('.name-value-table__item')
    Array.from(profileSettingsItems).forEach(function (profileSetting) {
        profileSetting.addEventListener('click', function () {
            let name = this.dataset.name;
            let label = this.querySelector('.name-value-table__name').textContent.trim();
            let type = (name === 'password') ? 'password' : 'text';
            let value = this.querySelector('.name-value-table__value').textContent.trim();

            let fragment = document.createElement('div');
            fragment.innerHTML = `<div class="form-group">
                            <div class="form-control">
                                <label for="${name}" class="form-control__label">${label}</label>
                                <input type="${type}" name="${name}" class="form-control__input" id="${name}" value="${value}">
                            </div>
                        </div>`;

            formControl.runOnAll(fragment);
            alertControl.showAlert(fragment.firstElementChild, `Edit ${name}`, {accept: {text: 'SAVE'}}, {
                method: 'post',
                action: '.'
            })
        })
    });
})();