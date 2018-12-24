const volume = {
  root: {
    bin: {},
    dev: {},
    home: {
      guest: {
        "info.txt": "This is a test text file.",
        file2: "test contents",
        dir1: {
          file3: "a file inside a dir"
        }
      }
    },
    media: {},
    opt: {},
    root: {},
    sys: {},
    usr: {
      bin: {
        less: args => {
          console.log(args);
        }
      }
    },
    boot: {},
    etc: {},
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
