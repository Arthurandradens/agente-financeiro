import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura' 
import App from './App.vue'

// PrimeVue components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
// DatePicker não existe no PrimeVue, usando Calendar
import MultiSelect from 'primevue/multiselect'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Card from 'primevue/card'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'

// PrimeVue icons
import 'primeicons/primeicons.css'

// Tailwind CSS
import './style.css'


const app = createApp(App)

// Pinia store
app.use(createPinia())

// PrimeVue configuration
app.use(PrimeVue, {
  unstyled: false,
  ripple: true,
  theme: { preset: Aura, options: { darkModeSelector: '.dark' } },
  ptOptions: {
    cssLayer: { name: 'primevue', order: 'tailwind-base, primevue, tailwind-utilities' }
  }
})
app.use(ToastService)

// Register components globally

app.component('Button', Button)
app.component('InputText', InputText)
app.component('DatePicker', DatePicker)
// DatePicker não registrado, usando Calendar
app.component('MultiSelect', MultiSelect)
app.component('Dropdown', Dropdown)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Card', Card)
app.component('Toast', Toast)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Badge', Badge)
app.component('Tag', Tag)

app.mount('#app')
