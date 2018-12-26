const volume = {
  root: {
    bin: {},
    dev: {},
    etc: {
      profile: `PATH=/usr/bin:/bin`
    },
    home: {
      guest: {
        ".profile": `PATH=~/`,
        file2: "test contents",
        dir1: {
          file3: "a file inside a dir"
        },
        "linkedin.sh": `#!/bin/sh
# This is a comment!
echo Hello World        # This is a comment, too!`
      }
    },
    media: {},
    opt: {},
    root: {},
    sys: {},
    usr: {
      bin: {
        less: (os, args) => {
          function error(message) {
            return { error: `less: ${message}` };
          }

          if (args.length < 2) return error("too few arguments");
          if (args.length > 2) return error("too many arguments");

          let filePath = os.resolvePath(args[1]);

          if (filePath) {
            return { screen: os.readfile(filePath) };
          } else {
            return error("invalid path");
          }
        }
      }
    },
    boot: {},
    lib: {},
    local: {},
    mnt: {},
    proc: {},
    run: {},
    srv: {},
    tmp: {
      "welcome-message": "\nWelcome to jjclowe.com\n"
    },
    var: {}
  }
};

module.exports = volume;
