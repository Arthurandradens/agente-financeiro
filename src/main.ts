import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import App from "./App.vue";

// PrimeVue components
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import DatePicker from "primevue/datepicker";
import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Card from "primevue/card";
import Toast from "primevue/toast";
import ToastService from "primevue/toastservice";
import ProgressSpinner from "primevue/progressspinner";
import ProgressBar from "primevue/progressbar";
import Badge from "primevue/badge";
import Tag from "primevue/tag";
import ConfirmDialog from "primevue/confirmdialog";
import ConfirmationService from "primevue/confirmationservice";
import Tooltip from "primevue/tooltip";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";

// PrimeVue icons
import "primeicons/primeicons.css";

// Tailwind CSS
import "./style.css";

const app = createApp(App);

// Pinia store
app.use(createPinia());

// PrimeVue configuration
app.use(PrimeVue, {
  unstyled: false,
  ripple: true,
  theme: { preset: Aura, options: { darkModeSelector: ".dark" } },
  ptOptions: {
    cssLayer: {
      name: "primevue",
      order: "tailwind-base, primevue, tailwind-utilities",
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);

// Register components globally

app.component("Button", Button);
app.component("InputText", InputText);
app.component("DatePicker", DatePicker);
app.component("MultiSelect", MultiSelect);
app.component("Select", Select);
app.component("DataTable", DataTable);
app.component("Column", Column);
app.component("Card", Card);
app.component("Toast", Toast);
app.component("ProgressSpinner", ProgressSpinner);
app.component("ProgressBar", ProgressBar);
app.component("Badge", Badge);
app.component("Tag", Tag);
app.component("ConfirmDialog", ConfirmDialog);
app.component("InputNumber", InputNumber);
app.component("Textarea", Textarea);

// Register directives
app.directive("tooltip", Tooltip);

app.mount("#app");
