stupid-server
=============

A rock stupid node static file server, built with express.

###Install it
    npm install -g stupid-server

###Run it
    stupidServer  [OPTION]... [DIR]

Navigate to http://localhost:8080/ and you'll find the contents of the specified directory, or the current directory if none was specified.

###Options
    -p, --port      Set the port to listen on (default: 8080)
    -h, --host      Set the host/ip to listen on (default: localhost)


Possibly Askable Questions
==========================

####Why would you build such a thing?
I often just want to fool around with some client-side js in a browser, just to try out an idea. I don't want to jump through any hoops to get my code in a browser, but I don't want to use codepen or jsfiddle either, as it may eventually evolve into someting more useful.

####But X other thing already does this
Well, crap. Now I just feel stupid.

####Will you add feature Y?
Sure, as long as it's simple enough to set via a command line option.
