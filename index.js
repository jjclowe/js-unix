const os = require("./os");
const volume = require("./volume");
const readline = require("readline");

const os1 = new os(volume, {});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

nextline = prefix => {
  rl.question(prefix, input => {
    os1.exec(input, function(response) {
      if (response.output == "!exit") {
        rl.close();
      } else {
        if (response.output) console.log(response.output);
        nextline(response.prefix);
      }
    });
  });
};

os1.boot(response => {
  console.log(response.output);
  nextline(response.prefix);
});
