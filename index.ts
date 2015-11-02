import {readFileSync} from 'fs';
import {logger, Level} from 'loge';
import * as yargs from 'yargs';

import {parseBibTeXEntries, extractCitekeys, parseNode} from 'tex';
import {BibTeXEntry} from 'tex/models';

type CLICommand = (filename: string) => void;

const cliCommands: {[index: string]: CLICommand} = {
  'bib-format': (filename: string) => {
    logger.debug('bib-format "%s"', filename);
    var data = readFileSync(filename, 'utf8');
    parseBibTeXEntries(data).forEach(reference => {
      console.log(reference.toBibTeX());
    });
  },
  'bib-json': (filename: string) => {
    logger.debug('bib-json "%s"', filename);
    var data = readFileSync(filename, 'utf8');
    parseBibTeXEntries(data).forEach(reference => {
      console.log(JSON.stringify(reference));
    });
  },
  'json-bib': (filename: string) => {
    logger.debug('json-bib "%s"', filename);
    var data = readFileSync(filename, 'utf8');
    data.trim().split(/\r\n|\r|\n/g).map(line => {
      var reference = JSON.parse(line);
      var entry = BibTeXEntry.fromJSON(reference);
      console.log(entry.toBibTeX());
    });
  },
  'bib-test': (filename: string) => {
    logger.debug('bib-test "%s"', filename);
    var data = readFileSync(filename, 'utf8');
    try {
      parseBibTeXEntries(data);
    }
    catch (exc) {
      console.error(filename);
    }
  },
  'tex-flatten': (filename: string) => {
    logger.debug('tex-flatten "%s"', filename);
    var data = readFileSync(filename, 'utf8');
    var node = parseNode(data);
    console.log(node.toString());
  },
  'tex-citekeys': (filename: string) => {
    logger.debug('tex-citekeys "%s"', filename);
    var data = readFileSync(filename, 'utf8');
    var citekeys: string[] = extractCitekeys(data);
    console.log(citekeys.join('\n'));
  },
};

export function main() {
  var yargs_parser = yargs
    .usage('Usage: tex-node <command> [<arg1> [<arg2> ...]]')
    .command('bib-test', 'Test that the given files can be parsed as BibTeX entries, printing the filename of unparseable files to STDERR')
    .command('bib-json', 'Parse bib files and format as JSON')
    .command('bib-format', 'Parse bib files and format as standard BibTeX')
    .command('json-bib', 'Parse JSON and format as standard BibTeX')
    .command('tex-flatten', 'Extract the text part from a string of TeX')
    .command('tex-citekeys', 'Extract the citekeys references in a TeX document (using RegExp)')
    .describe({
      help: 'print this help message',
      json: 'print JSON output',
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

  var argv = yargs_parser.argv;
  logger.level = argv.verbose ? Level.debug : Level.info;

  if (argv.help) {
    yargs_parser.showHelp();
  }
  else if (argv.version) {
    console.log(require('./package.json').version);
  }
  else {
    var [command, ...filenames] = yargs_parser.demand(1).argv._;
    var cliCommand = cliCommands[command];
    if (cliCommand === undefined) {
      console.error('Unrecognized command: "%s"', command);
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
    filenames.forEach(cliCommand);
  }
}
