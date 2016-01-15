var fs_1 = require('fs');
var loge_1 = require('loge');
var yargs = require('yargs');
var tex_1 = require('tex');
var models_1 = require('tex/models');
var commands = [
    {
        id: 'bib-format',
        description: 'Parse bib files and format as standard BibTeX',
        run: function (filename) {
            var data = fs_1.readFileSync(filename, 'utf8');
            tex_1.parseBibTeXEntries(data).forEach(function (reference) {
                console.log(reference.toBibTeX());
            });
        }
    },
    {
        id: 'bib-json',
        description: 'Parse bib files and format as JSON',
        run: function (filename) {
            var data = fs_1.readFileSync(filename, 'utf8');
            tex_1.parseBibTeXEntries(data).forEach(function (reference) {
                console.log(JSON.stringify(reference));
            });
        },
    },
    {
        id: 'json-bib',
        description: 'Parse JSON and format as standard BibTeX',
        run: function (filename) {
            var data = fs_1.readFileSync(filename, 'utf8');
            data.trim().split(/\r\n|\r|\n/g).map(function (line) {
                var reference = JSON.parse(line);
                var entry = models_1.BibTeXEntry.fromJSON(reference);
                console.log(entry.toBibTeX());
            });
        },
    },
    {
        id: 'bib-test',
        description: 'Test that the given files can be parsed as BibTeX entries, printing the filename of unparseable files to STDERR',
        run: function (filename) {
            var data = fs_1.readFileSync(filename, 'utf8');
            try {
                tex_1.parseBibTeXEntries(data);
            }
            catch (exc) {
                console.error(filename);
            }
        },
    },
    {
        id: 'tex-flatten',
        description: 'Extract the text part from a string of TeX',
        run: function (filename) {
            var data = fs_1.readFileSync(filename, 'utf8');
            var node = tex_1.parseNode(data);
            console.log(node.toString());
        },
    },
    {
        id: 'tex-citekeys',
        description: 'Extract the citekeys references in a TeX document (using RegExp)',
        run: function (filename) {
            var data = fs_1.readFileSync(filename, 'utf8');
            var citekeys = tex_1.extractCitekeys(data);
            console.log(citekeys.join('\n'));
        },
    },
];
function main() {
    var argvparser = yargs
        .usage('Usage: tex-node <command> [<arg1> [<arg2> ...]]')
        .describe({
        help: 'print this help message',
        verbose: 'print debug messages',
        version: 'print version',
    })
        .alias({
        help: 'h',
        verbose: 'v',
    })
        .boolean([
        'help',
        'verbose',
    ]);
    commands.forEach(function (command) {
        argvparser = argvparser.command(command.id, command.description);
    });
    var argv = argvparser.argv;
    loge_1.logger.level = argv.verbose ? loge_1.Level.debug : loge_1.Level.info;
    if (argv.help) {
        argvparser.showHelp();
    }
    else if (argv.version) {
        console.log(require('./package.json').version);
    }
    else {
        var _a = argvparser.demand(1).argv._, command_id = _a[0], filenames = _a.slice(1);
        var command = commands.filter(function (command) { return command.id === command_id; })[0];
        if (command === undefined) {
            console.error("Unrecognized command: \"" + command_id + "\"");
            process.exit(1);
        }
        process.on('SIGINT', function () {
            console.error('Ctrl+C :: SIGINT!');
            process.exit(130);
        });
        process.stdout.on('error', function (err) {
            if (err.code == 'EPIPE') {
                process.exit(0);
            }
        });
        filenames.forEach(function (filename) {
            loge_1.logger.debug(command.id + " \"" + filename + "\"");
            command.run(filename);
        });
    }
}
exports.main = main;
