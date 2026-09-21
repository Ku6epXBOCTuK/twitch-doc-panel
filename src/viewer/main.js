import { mount } from "svelte";
import App from "./App.svelte";
import "./viewer.css";

export default mount(App, { target: document.getElementById("app") });
