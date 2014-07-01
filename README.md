stupid-server
=============

A rock stupid command-line static file server, built with node/express.

###Install it
    npm install -g stupid-server

###Run it
    stupidserver  [OPTION]... [DIR]

Navigate to http://localhost:8080/ and you'll find the contents of the specified directory, or the current directory if none was specified.

###Options
    -p, --port      Set the port to listen on (default: 8080)
    -h, --host      Set the host/ip to listen on (default: localhost)


Possibly Askable Questions
==========================

####Why would you build such a thing?
I often just want to fool around with some client-side html/css/js, just to try out an idea. I don't want to jump through hoops to get the code in a browser, but I don't want to use codepen or jsfiddle either, as it may eventually evolve into someting more useful.

####But X other thing already does this
Well, crap. Now I just feel stupid.

####Will you add feature Y?
Sure, as long as it's simple enough to set via a command line option.
