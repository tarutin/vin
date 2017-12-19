const vin = {

    api: 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{VIN}?format=json&modelyear=2016',
    tbl: document.querySelector('app table'),
    form: document.querySelector('app form'),
    connectioner: document.querySelector('app .connection'),
    vintest: /^[A-HJ-NPR-Za-hj-npr-z\d]{8}/,
    key: null,
    filters: {},

    validation() {
        vin.key = vin.form.vin.value.trim()
        vin.form.submit.value = 'GET'

        let valid = vin.vintest.test(vin.key)
        vin.form.submit.disabled = valid ? '' : 'disabled'

        return valid
    },

    draw(list) {
        vin.tbl.querySelector('tbody').innerHTML = ''

        if (vin.filters) {
            if (vin.filters.direction) {
                list.sort((a, b) => {
                    if (a[vin.filters.sortindex] && b[vin.filters.sortindex]) {
                        return a[vin.filters.sortindex].toUpperCase() > b[vin.filters.sortindex].toUpperCase() ? 1 : -1
                    }
                })

                if (vin.filters.direction == 'desc') list.reverse()
            }

            if (vin.filters.search) {
                list = list.filter(function(a, b) {
                    let str = typeof a[vin.filters.searchindex] == 'string' ? a[vin.filters.searchindex].toUpperCase() : null

                    if (str) {
                        let search = vin.filters.search.toUpperCase()
                        return str.indexOf(search) !== -1
                    }
                })
            }
        }

        list.forEach(item => {
            vin.tbl.querySelector('tbody').innerHTML += `
                <tr>
                    <td>${item[0]}</td>
                    <td>${item[1]}</td>
                </tr>
            `
        })
    },

    fetch(e) {
        e.preventDefault()

        if (!vin.validation()) return false

        let ths = document.querySelectorAll('tr.sort th')
        for (let i = 0; i < ths.length; i++) {
            ths[i].removeAttribute('sort')
        }

        let inputs = document.querySelectorAll('tr.search th > input')
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].value = ''
        }

        vin.filters = {}
        vin.tbl.style.display = 'none'
        vin.form.submit.value = 'Loading...'

        vin.get(list => {
            vin.form.submit.value = 'GET'
            vin.draw(list)
            vin.tbl.style.display = 'table'
        })
    },

    isOnline() {
        let status = navigator.onLine
        vin.connectioner.style.display = status ? 'none' : 'block'

        return status
    },

    storage: {
        set(key, data) {
            localStorage.setItem(key, JSON.stringify(data))
        },

        get(key) {
            return JSON.parse(localStorage.getItem(key))
        },
    },

    get(cb) {
        if ((data = vin.storage.get(vin.key))) {
            cb(data)
        }
        else {
            if(!vin.isOnline()) return false

            let apiUrl = vin.api.replace('{VIN}', vin.key)
            let req = new XMLHttpRequest()

            req.overrideMimeType('application/json')
            req.open('GET', apiUrl, true)
            req.onload = function() {
                if (this.status === 200) {
                    let data = JSON.parse(req.responseText).Results
                    let dataArray = []

                    data.forEach(item => {
                        dataArray.push([item.Variable, item.Value])
                    })

                    vin.storage.set(vin.key, dataArray)
                    cb(dataArray)
                }
            }
            req.send(null)
        }
    },

    sort(e) {
        let ths = document.querySelectorAll('tr.sort th')
        for (let i = 0; i < ths.length; i++) {
            if (i != e.target.cellIndex) ths[i].removeAttribute('sort')
        }

        this.setAttribute('sort', this.getAttribute('sort') == 'asc' ? 'desc' : 'asc')

        vin.filters.sortindex = e.target.cellIndex
        vin.filters.direction = this.getAttribute('sort')
        vin.draw(vin.storage.get(vin.key))
    },

    search(e) {
        let inputs = document.querySelectorAll('tr.search th > input')
        for (let i = 0; i < inputs.length; i++) {
            if (i != e.target.parentNode.cellIndex) inputs[i].value = ''
        }

        vin.filters.searchindex = e.target.parentNode.cellIndex
        vin.filters.search = this.value
        vin.draw(vin.storage.get(vin.key))
    },

    init() {
        this.form.vin.onkeyup = this.validation
        this.form.onsubmit = this.fetch
        window.ononline = window.onoffline = this.isOnline

        let ths = document.querySelectorAll('tr.sort th')
        for (let i = 0; i < ths.length; i++) {
            ths[i].onclick = this.sort
        }

        let inputs = document.querySelectorAll('tr.search th > input')
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].onkeyup = this.search
        }

        console.log('vin.init')

        return this
    },

}.init()
