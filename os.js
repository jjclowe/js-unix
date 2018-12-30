class os {
  constructor(volume, options) {
    this.volume = volume;

    this.hostname = "dellxps";
    this.username = null;
    this.path = [];
    this.isRoot = false;
    this.activeProgram = null;
    this.env = {
      PATH: []
    };

    this.width = options.width;
    this.height = options.height;
  }

  boot(callback) {
    this.username = "guest";
    this.isRoot = this.username == "root";
    this.path = ["home", this.username];

    this.env = {
      PATH: [["usr", "bin"], ["bin"]]
    };

    // prepare response
    let response = {
      output: { string: this.readfile(["tmp", "welcome-message"]) },
      prompt: this.getPrefix()
    };

    callback(response);
  }

  getLinesFromString(string, startLine, lineCount) {
    const { width } = this;
    var lines = [];
    var buffer = string.slice();

    if (startLine === undefined) startLine = 0;

    function extractNextLine() {
      let nextLine = buffer.substr(0, width);

      if (nextLine.indexOf("\n") > -1) {
        nextLine = nextLine.substr(0, nextLine.indexOf("\n"));
        buffer = buffer.substr(nextLine.length + 1);
      } else {
        nextLine = nextLine.substr(0, width);
        buffer = buffer.substr(nextLine.length);
      }

      return nextLine;
    }

    do {
      lines.push(extractNextLine(buffer));
    } while (buffer.length);

    if (lineCount === undefined) lineCount = lines.length;

    return {
      lineCount: lines.length,
      lines: lines.slice(startLine, startLine + lineCount)
    };
  }

  getPrefix() {
    const { username, hostname, isRoot, path } = this;
    let folder = path[path.length - 1];
    if (!folder) folder = "/";
    if (!isRoot && path[0] == "home" && folder == this.username) folder = "~";
    return `${username}@${hostname}:${folder}` + (isRoot ? "#" : "$") + " ";
  }

  getVolumeObject(path) {
    const { volume } = this;
    var pointer = volume.root;
    if (path)
      path.forEach(element => {
        try {
          pointer = pointer[element];
        } catch (err) {}
      });
    return pointer;
  }

  resolvePath(pathString) {
    var pathBuffer = this.path.slice();
    let path = pathString.split("/");

    // remove uneccessary path parts
    path = path.filter(element => {
      if (element && element != ".") return element;
    });

    // if first character is / or ~ then force it back into the array
    if (pathString.substr(0, 1) == "/") path.unshift("/");
    if (pathString.substr(0, 1) == "~") path.unshift("~");

    // apply new path parts
    path.forEach(part => {
      switch (part) {
        case "/":
          // switch to absolute path
          pathBuffer = [];
          break;
        case "~":
          // if ~ then set path to home
          pathBuffer = ["home", this.username];
          break;
        case "..":
          // if .. remove last part from path
          pathBuffer.pop();
          break;
        default:
          if (part.substr(0, 1) == "~") part = part.substr(1);
          pathBuffer.push(part);
      }
    });

    return pathBuffer;
  }

  isDir(path) {
    return typeof this.getVolumeObject(path) === "object";
  }

  fileExists(path) {
    return this.getVolumeObject(path) ? true : false;
  }

  readfile(path) {
    const file = this.getVolumeObject(path);
    if (!file) {
      return { error: `file '${path.join("/")}' not found` };
    } else if (typeof file == "string") {
      return file;
    } else {
      return { error: `invalid file '${path.join("/")}'` };
    }
  }

  exec(lineInput, keyInput, callback) {
    const args = lineInput ? lineInput.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) : [];
    var volumeObject = null;
    var responseObject = {};

    // remove quotes
    for (let i = 0; i < args.length; i++) {
      if (args[i].substr(0, 1) == '"' && args[i].substr(args[i].length - 1, 1) == '"') {
        args[i] = args[i].substr(1, args[i].length - 2);
      } else if (args[i].substr(0, 1) == "'" && args[i].substr(args[i].length - 1, 1) == "'") {
        args[i] = args[i].substr(1, args[i].length - 2);
      }
    }

    if (this.activeProgram) {
      // send input to last active program
      volumeObject = this.activeProgram;
      responseObject = this.activeProgram.continue(keyInput);
    } else {
      if (args[0] === undefined) {
        // empty instruction
        responseObject = {
          prompt: this.getPrefix()
        };
      } else if (this["_" + args[0]]) {
        // native program exists
        responseObject = this["_" + args[0]](args);
      } else if (this.fileExists([...this.path, args[0]])) {
        // item matching program name exists in current path
        volumeObject = this.getVolumeObject([...this.path, args[0]]);
        if (typeof volumeObject == "function") {
          // item is program
          volumeObject = new volumeObject(this);
          responseObject = volumeObject.start(args);
        }
      } else if (this.fileExists(this.resolvePath(args[0]))) {
        // item is a path to a file that exists
        volumeObject = this.getVolumeObject(this.resolvePath(args[0]));
        if (typeof volumeObject == "function") {
          // item is a path to a program that exists
          volumeObject = new volumeObject(this);
          responseObject = volumeObject.start(args);
        }
      } else {
        let { PATH } = this.env;

        PATH.forEach(path => {
          if (typeof this.getVolumeObject([...path, args[0]]) == "function") {
            // program found in an env PATH
            volumeObject = this.getVolumeObject([...path, args[0]]);
          }
        });

        if (volumeObject) {
          volumeObject = new volumeObject(this);
          responseObject = volumeObject.start(args);
        } else {
          // program not found
          responseObject = {
            error: `command '${args[0]}' not found`,
            prompt: this.getPrefix()
          };
        }
      }
    }

    if (responseObject.activeProgram) {
      this.activeProgram = volumeObject;
      responseObject.activeProgram = volumeObject;
    } else {
      this.activeProgram = null;
    }

    callback({ lineInput: args, ...responseObject });
  }

  _exit(args) {
    return { action: "exit", output: { string: "Goodbye." } };
  }

  _ls(args) {
    const pointer = this.getVolumeObject(this.path);
    let items = [];
    for (let i in pointer) {
      if (this.isDir([...this.path, i])) {
        items.push({ type: "dir", name: i });
      } else {
        items.push({ type: "file", name: i });
      }
    }
    return {
      output: {
        list: items
      },
      prompt: this.getPrefix()
    };
  }

  _cd(args) {
    const error = message => {
      return {
        error: `cd: ${message}`,
        prompt: this.getPrefix()
      };
    };

    let newPath = null;

    if (args.length > 3) return error("too many arguments");

    if (args.length === 1) {
      if (this.isRoot) {
        newPath = [];
      } else {
        newPath = ["home", this.username];
      }
    } else if (args.length === 2) {
      newPath = this.resolvePath(args[1]);
    }

    // set new path
    if (!newPath) {
      return error(`invalid path`);
    } else if (!this.isDir(newPath)) {
      return error(`'${newPath[newPath.length - 1]}' is not a directory`);
    } else {
      this.path = newPath;
      return {
        prompt: this.getPrefix()
      };
    }
  }

  _cp(args) {
    const error = message => {
      return {
        error: `cp: ${message}`,
        prompt: this.getPrefix()
      };
    };

    if (args.length === 1) return error("too few arguments");
    if (args.length === 2) return error(`missing destination file operand after ‘${args[1]}’`);
    if (args.length > 3) return error("too many arguments");

    if (args.length === 3) {
      let file1 = this.resolvePath(args[1]);
      let file2 = this.resolvePath(args[2]);
      console.log(file1);
      console.log(file2);

      if (!this.fileExists(file1)) return error(`file ${file1[file1.length - 1]} does not exist`);

      return {
        output: {
          string: `// copying '${args[1]}' to '${args[2]}'`
        },
        prompt: this.getPrefix()
      };
    }
  }
}

module.exports = os;
