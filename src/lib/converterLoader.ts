let converterPromise: Promise<typeof import('./converter')> | null = null
let converterModule: typeof import('./converter') | null = null

export function loadConverter() {
  if (converterModule) return Promise.resolve(converterModule)
  if (!converterPromise) {
    converterPromise = import('./converter').then((module) => {
      converterModule = module
      return module
    })
  }
  return converterPromise
}

export function getConverterIfLoaded() {
  return converterModule
}
