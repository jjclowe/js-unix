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
    os1.exec(input, function(output) {
      if (output.buffer == "!exit") {
        rl.close();
      } else {
        if (output.buffer) console.log(output.buffer);
        nextline(output.prefix);
      }
    });
  });
};

os1.boot(output => {
  console.log(output.buffer);
  nextline(output.prefix);
});
