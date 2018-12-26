class os {
  constructor(volume, options) {
    this.volume = volume;

    this.hostname = "dellxps";
    this.username = null;
    this.path = [];
    this.isRoot = false;
    this.env = {
      PATH: []
    };
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
      prefix: this.getPrefix(),
      output: this.readfile(["tmp", "welcome-message"])
    };

    callback(response);
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
      return { string: file };
    } else {
      return { error: `invalid file '${path.join("/")}'` };
    }
  }

  exec(rawInput, callback) {
    const input = rawInput.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) || [];
    let returnObject = {};

    // remove quotes
    for (let i = 0; i < input.length; i++) {
      if (input[i].substr(0, 1) == '"' && input[i].substr(input[i].length - 1, 1) == '"') {
        input[i] = input[i].substr(1, input[i].length - 2);
      } else if (input[i].substr(0, 1) == "'" && input[i].substr(input[i].length - 1, 1) == "'") {
        input[i] = input[i].substr(1, input[i].length - 2);
      }
    }

    if (input[0] === undefined) {
      // empty instruction
    } else if (this["_" + input[0]]) {
      // native program exists
      returnObject.output = this["_" + input[0]](input);
    } else if (this.fileExists([...this.path, input[0]])) {
      // item matching program name exists in current path
      let volumeObject = this.getVolumeObject([...this.path, input[0]]);
      if (typeof volumeObject == "function") {
        // item is program
        returnObject.output = volumeObject(this, input);
      }
    } else if (this.fileExists(this.resolvePath(input[0]))) {
      // item is a path to a file that exists
      let volumeObject = this.getVolumeObject(this.resolvePath(input[0]));
      if (typeof volumeObject == "function") {
        // item is a path to a program that exists
        returnObject.output = volumeObject(this, input);
      }
    } else {
      let { PATH } = this.env;
      var volumeObject = null;

      PATH.forEach(path => {
        if (typeof this.getVolumeObject([...path, input[0]]) == "function") {
          // program found in an env PATH
          volumeObject = this.getVolumeObject([...path, input[0]]);
        }
      });

      if (volumeObject) {
        returnObject.output = volumeObject(this, input);
      } else {
        // program not found
        returnObject.output = { error: `command '${input[0]}' not found` };
      }
    }

    returnObject.input = input;
    returnObject.prefix = this.getPrefix();

    callback(returnObject);
  }

  _exit(args) {
    return { action: exit };
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
    return { list: items };
  }

  _cd(args) {
    function error(message) {
      return { error: `cd: ${message}` };
    }

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
    } else if (this.isDir(newPath)) {
      this.path = newPath;
    } else {
      return error(`'${newPath[newPath.length - 1]}' is not a directory`);
    }
  }

  _cp(args) {
    function error(message) {
      return { error: `cp: ${message}` };
    }

    if (args.length === 1) return error("too few arguments");
    if (args.length === 2) return error(`missing destination file operand after ‘${args[1]}’`);
    if (args.length > 3) return error("too many arguments");

    if (args.length === 3) {
      let file1 = this.resolvePath(args[1]);
      let file2 = this.resolvePath(args[2]);
      console.log(file1);
      console.log(file2);

      if (!this.fileExists(file1)) return error(`file ${file1[file1.length - 1]} does not exist`);

      return `// copying '${args[1]}' to '${args[2]}'`;
    }
  }
}

module.exports = os;
