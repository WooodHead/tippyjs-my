import Popper from './popper'

// .closest() polyfill
if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector
if (!Element.prototype.closest) Element.prototype.closest = function (selector) {
    var el = this
    while (el) {
        if (el.matches(selector)) {
            return el
        }
        el = el.parentElement
    }
}

/**!
 * @file tippy.js | Pure JS Tooltip Library
 * @version 0.1.0
 * @license MIT
 */

class Tippy {
    constructor(selector, settings = {}) {

        this.selector = selector
        this.callbacks = {}
        this.classNames = {
            popper: 'tippy-popper',
            tooltip: 'tippy-tooltip',
            content: 'tippy-tooltip-content'
        }
        this.tooltippedEls = [].slice.call(document.querySelectorAll(selector))

        const defaults = {
            html: false,
            position: 'top',
            animation: 'shift',
            animateFill: true,
            arrow: false,
            delay: 0,
            trigger: 'mouseenter focus',
            duration: 400,
            theme: 'dark',
            offset: 0
        }

        this.settings = defaults;

        if (!Tippy.bus) {
            Tippy.bus = {}
            Tippy.bus.refs = []
        }

        this._createTooltips()

    }

    _setCaches() {
        this.poppers = [].slice.call(
            document.querySelectorAll(
                `.${this.classNames.popper}[x-init="${this.selector}"]`
            )
        )
        this.popperMap = Tippy.bus.refs.map(ref => ref.popper)
        this.tooltippedElMap = Tippy.bus.refs.map(ref => ref.tooltippedEl)
    }

    show(popper, duration = 400) {


        const tooltip = popper.querySelector(`.${this.classNames.tooltip}`)
        const circle = popper.querySelector('[x-circle]')

        tooltip.style.WebkitTransitionDuration = duration + 'ms'
        tooltip.style.transitionDuration = duration + 'ms'
        tooltip.classList.add('enter')
        tooltip.classList.remove('leave')

        if (circle) {
            circle.style.WebkitTransitionDuration = duration + 'ms'
            circle.style.transitionDuration = duration + 'ms'
            circle.classList.add('enter')
            circle.classList.remove('leave')
        }

        popper.style.visibility = 'visible'
        popper.focus()

    }

    hide(popper) {
        // Clear unwanted timeouts due to `delay` setting
        clearTimeout(popper.getAttribute('data-timeout'))

        // Hidden anyway
        if (getComputedStyle(popper).getPropertyValue('visibility') === 'hidden') return

        const ref = Tippy.bus.refs[this.popperMap.indexOf(popper)]
        ref.tooltippedEl.classList.remove('active')

        const tooltip = popper.querySelector(`.${this.classNames.tooltip}`)
        tooltip.classList.add('leave')
        tooltip.classList.remove('enter')

        const circle = popper.querySelector('[x-circle]')
        if (circle) {
            circle.classList.add('leave')
            circle.classList.remove('enter')
        }

        popper.style.visibility = 'hidden'

        const duration = parseInt(tooltip.style.transitionDuration.replace('ms', '')) ||
            parseInt(tooltip.style.WebkitTransitionDuration.replace('ms', ''))

        setTimeout(() => {
            if (popper.style.visibility === 'visible') return

        }, duration)
    }



    _createPopperInstance(tooltippedEl, popper, settings) {

        const config = {
            placement: settings.position,
            modifiers: {
                offset: {
                    offset: parseInt(settings.offset)
                }
            }
        }

        setTimeout(() => {
            const instance = new Popper(
                tooltippedEl,
                popper,
                config
            )
            instance.enableEventListeners()
        }, 0)
    }

    _createPopperElement(title, settings) {
        const popper = document.createElement('div')
        popper.setAttribute('class', this.classNames.popper)
        popper.setAttribute('x-init', this.selector)

        const tooltip = document.createElement('div')
        tooltip.setAttribute('class', `${this.classNames.tooltip} ${settings.theme} leave`)
        tooltip.setAttribute('data-position', settings.position)
        tooltip.setAttribute('data-animation', settings.animation)



        // Tooltip content (text or HTML)
        const content = document.createElement('div')
        content.setAttribute('class', this.classNames.content)


        content.innerHTML = title


        tooltip.appendChild(content)
        popper.appendChild(tooltip)
        document.body.appendChild(popper)

        return popper
    }

    _createTooltips() {
        this.tooltippedEls.forEach(el => {

            const settings = this.settings;

            const title = el.getAttribute('title')
            // Do not create a tooltip for title attributeless, empty strings or no html els
            if ((title === null || title === '') && !settings.html) return

            // Remove default browser tooltip
            el.setAttribute('data-original-title', title || 'html')
            el.removeAttribute('title')

            // Give elements a data-tooltipped attribute (needed for document click handler)
            el.setAttribute('data-tooltipped', '')

            // Create a new popper element and instance
            const popper = this._createPopperElement(title, settings)
            this._createPopperInstance(el, popper, settings)

            // Add the element-popper pair reference object to global refs array
            Tippy.bus.refs.push({
                tooltippedEl: el,
                popper,
                trigger: settings.trigger
            })

            // Turn trigger string like "mouseenter focus" into an array
            if (!Array.isArray(settings.trigger)) {
                settings.trigger = settings.trigger.trim().split(' ')
            }

            const handleTrigger = event => {
                if (event === 'click' && popper.style.visibility === 'visible') {
                    return this.hide(popper)
                }
                if (settings.delay) {
                    const timeout = setTimeout(
                        () => this.show(popper, settings.duration),
                        settings.delay
                    )
                    // Allow the hide() function to clear any unwanted timeouts due to delays
                    popper.setAttribute('data-timeout', timeout)
                } else {
                    this.show(popper, settings.duration)
                }
                
            }

            const getRef = target => {
                const tooltippedElIndex = this.tooltippedElMap.indexOf(target)
                return Tippy.bus.refs[tooltippedElIndex]
            }

            const handleMouseleave = event => {
                const ref = getRef(event.target)

               
                this.hide(ref.popper)
            }

            const handleBlur = event => {
                const ref = getRef(event.target)
                this.hide(ref.popper)
            }

            // Add event listeners for each trigger specified
            settings.trigger.forEach(event => {
                if (event === 'manual') return

                // Enter
                el.addEventListener(event, handleTrigger)

                // Leave
                if (event === 'mouseenter') {
                    el.addEventListener('mouseleave', handleMouseleave)
                }
                if (event === 'focus') {
                    el.addEventListener('blur', handleBlur)
                }
            })

            // If last el in loop, ready to set DOM/map caches
            if (el === this.tooltippedEls[this.tooltippedEls.length - 1]) {
                this._setCaches()
            }

        })
    }
}

window.Tippy = Tippy

module.exports = Tippy