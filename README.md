stupid-server
=============

A rock stupid command-line static file server, built with node/express.

###Install it
    npm install -g stupid-server

###Use it

      Usage: server-cli [options] [path-to-host]

      Options:

        -h, --help             output usage information
        -h, --host [hostname]  set the host to listen on [localhost]
        -p, --port [portnum]   set the port to listen on [8080]
        -f, --flatten          flatten requests for html or directories to the server root.

      Notes:

        If no path is specified, the CWD will be used

        The --flatten option is primarily useful for single page js apps that use
        the history api to create natural URIs rather than hash based routes


Possibly Askable Questions
==========================

####Why would you build such a thing?
I often just want to fool around with some client-side html/css/js, just to try out an idea. I don't want to jump through hoops to get the code in a browser, but I don't want to use codepen or jsfiddle either, as it may eventually evolve into someting more useful.

####But X other thing already does this
Well, crap. Now I just feel stupid. Thanks.

####Will you add feature Y?
Sure, as long as it's simple enough to set via a command line option.
