import webpack = require("webpack");

export default class JsonpMainTemplatePluginHook {
  apply(mainTemplate: any): void {
    if (mainTemplate.hooks.jsonpScript) {
      mainTemplate.hooks.jsonpScript.tap(
        "JsonpMainTemplatePluginHook",
        (script: string, chunk, hash) => {
          return script.replace(
            "script.onerror = script.onload = onScriptComplete;",
            "script.onerror = onScriptComplete;"
          );
        }
      );
    }
  }
}
