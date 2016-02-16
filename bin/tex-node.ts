#!/usr/bin/env node
import {readFileSync} from 'fs';
import * as optimist from 'optimist';

import {parseNode, parseBibTeXEntries, extractCitekeys,
  stringifyBibTeXEntry,
  flattenBibTeXEntry, unflattenBibTeXEntry} from 'tex';
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
      const data = readFileSync(filename, 'utf8');
      parseBibTeXEntries(data).forEach(bibTeXEntry => {
        console.log(stringifyBibTeXEntry(bibTeXEntry));
      });
    }
  },
  {
    id: 'bib-json',
    description: 'Parse bib files and format as JSON',
    run(filename: string) {
      const data = readFileSync(filename, 'utf8');
      parseBibTeXEntries(data).forEach(bibTeXEntry => {
        console.log(JSON.stringify(flattenBibTeXEntry(bibTeXEntry)));
      });
    },
  },
  {
    id: 'json-bib',
    description: 'Parse JSON and format as standard BibTeX',
    run(filename: string) {
      const data = readFileSync(filename, 'utf8');
      data.trim().split(/\r\n|\r|\n/g).map(line => {
        const object = JSON.parse(line);
        const bibTeXEntry = unflattenBibTeXEntry(object);
        console.log(stringifyBibTeXEntry(bibTeXEntry));
      });
    },
  },
  {
    id: 'bib-test',
    description: 'Test that the given files can be parsed as BibTeX entries, printing the filename of unparseable files to STDERR',
    run(filename: string) {
      const data = readFileSync(filename, 'utf8');
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
      const data = readFileSync(filename, 'utf8');
      const node = parseNode(data);
      console.log(node.toString());
    },
  },
  {
    id: 'tex-citekeys',
    description: 'Extract the citekeys references in a TeX document (using RegExp)',
    run(filename: string) {
      const data = readFileSync(filename, 'utf8');
      const citekeys = extractCitekeys(data);
      console.log(citekeys.join('\n'));
    },
  },
];

export function main() {
  let argvparser = optimist
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

  const overallUsage = 'Usage: tex-node <command> [<arg1> [<arg2> ...]]';
  const commandsLines = commands.map(command => `  ${command.id}: ${command.description}`);
  const usage = [overallUsage, ...commandsLines].join('\n');
  argvparser = argvparser.usage(usage);

  let argv = argvparser.argv;

  if (argv.help) {
    argvparser.showHelp();
  }
  else if (argv.version) {
    console.log(require('./package.json').version);
  }
  else {
    const [command_id, ...filenames] = argvparser.demand(1).argv._;
    const command = commands.filter(command => command.id === command_id)[0];
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
      if (argv.verbose) {
        console.error(`${command.id} "${filename}"`);
      }
      command.run(filename);
    });
  }
}

if (require.main === module) {
  main();
}
