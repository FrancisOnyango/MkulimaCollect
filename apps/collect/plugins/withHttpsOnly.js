const { withAndroidManifest, withMainActivity } = require("expo/config-plugins");

function withHttpsOnlyAndSecureWindow(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application?.$) {
      application.$["android:allowBackup"] = "false";
      application.$["android:usesCleartextTraffic"] = "false";
    }
    return mod;
  });

  return withMainActivity(config, (mod) => {
    let src = mod.modResults.contents;
    if (!src.includes("FLAG_SECURE")) {
      if (src.includes("import android.os.Bundle")) {
        src = src.replace("import android.os.Bundle", "import android.os.Bundle\nimport android.view.WindowManager");
      }
      src = src.replace(
        /super\.onCreate\((savedInstanceState|null)\)/,
        "super.onCreate($1)\n    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)",
      );
      mod.modResults.contents = src;
    }
    return mod;
  });
}

module.exports = withHttpsOnlyAndSecureWindow;
