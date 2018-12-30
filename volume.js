const volume = {
  root: {
    bin: {},
    dev: {},
    etc: {
      profile: `PATH=/usr/bin:/bin`
    },
    home: {
      guest: {
        "linkedin.sh": `#!/bin/bash\necho https://www.linkedin.com/in/jjclowe/\n<script>window.open('https://www.linkedin.com/in/jjclowe/')</script>`,
        ".profile": `PATH=~/`,
        "test.txt": `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin fermentum, risus sed convallis tristique, dui urna iaculis augue, eu sagittis mi nulla non augue. Nulla eget nunc semper, mattis tellus vitae, laoreet enim. Integer odio est, viverra nec blandit nec, ullamcorper quis massa. Nam ut nisi ipsum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec enim vitae lacus auctor sollicitudin. Morbi vitae augue at sem lacinia vestibulum.

Integer ultricies orci a pretium finibus. Pellentesque malesuada ipsum justo, et commodo libero venenatis eu. Morbi eu nisi at arcu sollicitudin molestie. Integer varius orci ut ex viverra, in pulvinar tortor mollis. Vestibulum scelerisque turpis eget mollis facilisis. Sed nec nulla turpis. Cras cursus, dui vel pharetra porta, turpis erat cursus neque, sed posuere tortor nisi a est. Aenean et mattis nulla. Curabitur interdum mi eu enim aliquam interdum. Aenean aliquet justo vitae vestibulum tincidunt. Proin congue ipsum velit, in lacinia justo consectetur placerat. Vestibulum ac maximus sapien.

Praesent scelerisque in odio eget placerat. Aliquam molestie laoreet facilisis. Morbi id gravida nulla. Morbi eleifend condimentum vulputate. Praesent eget elit at elit aliquam placerat in non purus. Maecenas et feugiat magna. Donec elementum efficitur malesuada. Ut in lectus et orci dictum pulvinar vitae varius purus. Donec mattis quis mi et finibus. Vestibulum interdum, ex vitae faucibus tempor, metus odio suscipit lorem, lacinia congue eros dui nec massa. Phasellus eu elit orci. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis ac turpis sit amet ex rhoncus feugiat id a est. Vivamus imperdiet ante consequat libero convallis, id bibendum orci vehicula.

Phasellus eu tortor ac risus accumsan imperdiet. Vestibulum dapibus mi diam, sit amet fermentum massa ultricies vitae. Nam ex diam, posuere et tempor quis, ornare ut tellus. Quisque cursus congue diam, id posuere urna fringilla eget. In sodales lacinia sapien, sed aliquam enim ultrices nec. Aliquam a urna ac erat fringilla aliquam nec a ante. Curabitur efficitur elementum faucibus. Morbi dictum, mi quis gravida euismod, sem lacus accumsan ipsum, non dapibus leo metus sed leo. Curabitur dictum elit et erat malesuada, id iaculis diam ultricies. Duis augue nisi, suscipit vel est dignissim, dapibus dapibus tellus.

Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec hendrerit tellus non lacus volutpat, sodales hendrerit velit consequat. Curabitur cursus ipsum a massa bibendum vehicula. Sed eget ligula et eros commodo interdum. Donec id consectetur sapien, id sollicitudin nulla. Nunc a nisi ornare, consectetur ligula et, pellentesque augue. Ut eu felis efficitur, ultricies turpis vitae, laoreet erat. Fusce et est tincidunt, auctor magna eu, dictum lacus. Integer ac nunc eget mi volutpat rhoncus.`,
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
        bash: function(os) {
          this.fileContents = null;

          this.start = lineInput => {
            const error = message => {
              return {
                error: `bash: ${message}`,
                prompt: os.getPrefix()
              };
            };

            if (lineInput.length < 2) return error("too few arguments");
            if (lineInput.length > 2) return error("too many arguments");

            let filePath = os.resolvePath(lineInput[1]);
            if (!filePath) return error("invalid path");
            if (!os.fileExists(filePath)) return error("file not found");

            this.fileContents = os.readfile(filePath);

            if (this.fileContents.error) return error("invalid path");

            return {
              output: { string: this.fileContents },
              prompt: os.getPrefix()
            };
          };

          return this;
        },
        cat: function(os) {
          this.fileContents = null;

          this.start = lineInput => {
            const error = message => {
              return {
                error: `cat: ${message}`,
                prompt: os.getPrefix()
              };
            };

            if (lineInput.length < 2) return error("too few arguments");
            if (lineInput.length > 2) return error("too many arguments");

            let filePath = os.resolvePath(lineInput[1]);
            if (!filePath) return error("invalid path");
            if (!os.fileExists(filePath)) return error("file not found");

            this.fileContents = os.readfile(filePath);

            if (this.fileContents.error) return error("invalid path");

            return {
              output: { string: this.fileContents },
              prompt: os.getPrefix()
            };
          };

          return this;
        } /*,
        less: function(os) {
          this.fileContents = null;
          this.currentLine = 0;
          this.header = ["{{HEADER}}"];
          this.footer = ["{{FOOTER}}"];

          drawDisplay = () => {
            if (this.currentLine < 0) this.currentLine = 0;

            let { lines, lineCount } = os.getLinesFromString(
              this.fileContents,
              this.currentLine,
              os.height // - this.header.length - this.footer.length
            );

            if (this.currentLine > lineCount - os.height - 1) this.currentLine = lineCount - os.height - 1;

            return {
              //output: [...this.header, ...lines, ...this.footer],
              output: lines,
              activeProgram: true
            };
          };

          this.start = lineInput => {
            const error = message => {
              return {
                error: `less: ${message}`,
                prompt: os.getPrefix()
              };
            };

            if (lineInput.length < 2) return error("too few arguments");
            if (lineInput.length > 2) return error("too many arguments");

            let filePath = os.resolvePath(lineInput[1]);
            if (!filePath) return error("invalid path");
            if (!os.fileExists(filePath)) return error("file not found");

            this.fileContents = os.readfile(filePath);

            if (this.fileContents.error) return error("invalid path");

            return drawDisplay();
          };

          this.continue = keyInput => {
            switch (keyInput.name) {
              case "q":
                return {
                  prompt: os.getPrefix()
                };
                break;
              case "up":
                this.currentLine--;
                return drawDisplay();
                break;
              case "down":
                this.currentLine++;
                return drawDisplay();
                break;
            }

            return drawDisplay();
          };

          return this;
        }*/
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
    var: {
      www: {
        html: {
          "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<body>
  
</body>
</html>`
        }
      }
    }
  }
};

module.exports = volume;
