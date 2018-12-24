class os {
  constructor(volume, options) {
    this.volume = volume;

    this.hostname = "dellxps";
    this.username = null;
    this.path = [];
    this.isRoot = false;
  }

  boot(callback) {
    this.username = "guest";
    this.isRoot = this.username == "root";
    this.path = ["home", this.username];

    // prepare output
    let output = {
      prefix: this.getPrefix(),
      buffer: this.readfile(["tmp", "welcome-message"])
    };

    callback(output);
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
    return file ? file : `file '${path.join("/")}' not found`;
  }

  exec(rawInput, callback) {
    const input = rawInput.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) || [];
    let output = {};

    // remove quotes
    for (let i = 0; i < input.length; i++) {
      if (input[i].substr(0, 1) == '"' && input[i].substr(input[i].length - 1, 1) == '"') {
        input[i] = input[i].substr(1, input[i].length - 2);
      } else if (input[i].substr(0, 1) == "'" && input[i].substr(input[i].length - 1, 1) == "'") {
        input[i] = input[i].substr(1, input[i].length - 2);
      }
    }

    console.log("#");
    console.log();
    console.log("#");

    if (input[0] === undefined) {
      // empty instruction
    } else if (this["_" + input[0]]) {
      // native program exists
      output.buffer = this["_" + input[0]](input);
    } else if (this.fileExists([...this.path, input[0]])) {
      // item matching program name exists in current path
      // if(matching path is function){

      //}
      console.log("program in this path");
    } else {
      // program not found
      output.buffer = "command not found";
    }

    output.input = input;
    output.prefix = this.getPrefix();

    callback(output);
  }

  _exit(args) {
    return "!exit";
  }

  _ls(args) {
    const pointer = this.getVolumeObject(this.path);
    let items = [];
    for (let i in pointer) items.push(i);
    return items.join("\t");
  }

  _cd(args) {
    function error(message) {
      return `cd: ${message}`;
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
      return `cp: ${message}`;
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
