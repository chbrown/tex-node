import {readFileSync} from 'fs';
import {logger, Level} from 'loge';
import * as yargs from 'yargs';

import {parseBibTeXEntries, extractCitekeys, parseNode} from 'tex';
import {BibTeXEntry} from 'tex/models';

interface Command {
  id: string;
  description: string;
  run: (filename: string) => void;
}

const commands: Command[] = [
  {
    id: 'bib-format',
    description: 'Parse bib files and format as standard BibTeX',
    run(filename: string) {
      var data = readFileSync(filename, 'utf8');
      parseBibTeXEntries(data).forEach(reference => {
        console.log(reference.toBibTeX());
      });
    }
  },
  {
    id: 'bib-json',
    description: 'Parse bib files and format as JSON',
    run(filename: string) {
      var data = readFileSync(filename, 'utf8');
      parseBibTeXEntries(data).forEach(reference => {
        console.log(JSON.stringify(reference));
      });
    },
  },
  {
    id: 'json-bib',
    description: 'Parse JSON and format as standard BibTeX',
    run(filename: string) {
      var data = readFileSync(filename, 'utf8');
      data.trim().split(/\r\n|\r|\n/g).map(line => {
        var reference = JSON.parse(line);
        var entry = BibTeXEntry.fromJSON(reference);
        console.log(entry.toBibTeX());
      });
    },
  },
  {
    id: 'bib-test',
    description: 'Test that the given files can be parsed as BibTeX entries, printing the filename of unparseable files to STDERR',
    run(filename: string) {
      var data = readFileSync(filename, 'utf8');
      try {
        parseBibTeXEntries(data);
      }
      catch (exc) {
        console.error(filename);
      }
    },
  },
  {
    id: 'tex-flatten',
    description: 'Extract the text part from a string of TeX',
    run(filename: string) {
      var data = readFileSync(filename, 'utf8');
      var node = parseNode(data);
      console.log(node.toString());
    },
  },
  {
    id: 'tex-citekeys',
    description: 'Extract the citekeys references in a TeX document (using RegExp)',
    run(filename: string) {
      var data = readFileSync(filename, 'utf8');
      var citekeys = extractCitekeys(data);
      console.log(citekeys.join('\n'));
    },
  },
];

export function main() {
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

  commands.forEach(command => {
    argvparser = argvparser.command(command.id, command.description);
  });

  var argv = argvparser.argv;
  logger.level = argv.verbose ? Level.debug : Level.info;

  if (argv.help) {
    argvparser.showHelp();
  }
  else if (argv.version) {
    console.log(require('./package.json').version);
  }
  else {
    var [command_id, ...filenames] = argvparser.demand(1).argv._;
    var command = commands.filter(command => command.id === command_id)[0];
    if (command === undefined) {
      console.error(`Unrecognized command: "${command_id}"`);
      process.exit(1);
    }
    process.on('SIGINT', () => {
      console.error('Ctrl+C :: SIGINT!');
      process.exit(130);
    });
    process.stdout.on('error', err => {
      if (err.code == 'EPIPE') {
        process.exit(0);
      }
    });
    filenames.forEach(filename => {
      logger.debug(`${command.id} "${filename}"`);
      command.run(filename);
    });
  }
}
