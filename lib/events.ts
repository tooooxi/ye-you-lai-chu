export function notifyProjectUpdated() {
  window.dispatchEvent(new Event("yylc:project-updated"));
}

export function notifyProjectsChanged() {
  window.dispatchEvent(new Event("yylc:projects-changed"));
}
