const debug = false;

const os = require("./os");
const volume = require("./volume");
const readline = require("readline");

const os1 = new os(volume, { width: 100, height: 20 });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var keyListen = false;

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

handleResponse = response => {
  let exit = false;

  if (response.action) {
    switch (response.action) {
      case "exit":
        exit = true;
        break;
    }
  }

  if (debug) console.log(response);
  if (response.error) console.log(response.error);
  if (response.output) console.log(response.output);

  if (exit) {
    rl.close();
  } else {
    if (response.prompt) {
      keyListen = false;
      prompt(response.prompt);
    } else {
      setTimeout(() => {
        keyListen = true;
      }, 0);
    }
  }
};

prompt = prefix => {
  rl.question(prefix, input => {
    os1.exec(input, null, function(response) {
      handleResponse(response);
    });
  });
};

process.stdin.on("keypress", (str, key) => {
  if (keyListen) {
    if (key.ctrl && key.name === "c") {
      process.exit();
    } else {
      os1.exec(null, key, function(response) {
        handleResponse(response);
      });
    }
  }
});

os1.boot(response => {
  handleResponse(response);
});
