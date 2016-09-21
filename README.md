stupid-server
=============

A rock stupid command-line static file server, built with node/express.

###Install it
    npm install -g stupid-server

###Use it

    Usage: stupid-server [options] [path to serve]

     Options:

       -h, --help                          output usage information
       -f, --flatten                       flatten requests for html or directories to the server root.
       -h, --host [hostname]               set the host to listen on [localhost]
       -p, --port [portnum]                set the port to listen on [8080], [8443] with --secure
       -s, --secure                        use https with an automatically generated self-signed certificate
       -x, --proxy <path::destinationUrl>  proxy requests under path to destination
       -c, --cert [certPath]               path to a self-signed certificate to use for https
       -k, --key [keyPath]                 path to the key for the --cert certificate

     Notes:

       If no path is specified, the CWD will be used

       Multiple --proxy options can be specified

       The --flatten option is primarily useful for single page js apps that use
       the history api to create natural URIs rather than hash based routes

###Notes

The flatten middleware may have issues when running under Windows, as it's using the
path module for some URL path logic, because I'm lazy.

Generating self signed certs for use in making a "secure" local development server can be
done in multiple ways. Using [dev-cert-authority](https://github.com/latentflip/dev-cert-authority)
is pretty easy and straightforward. Use with stupid server by following the installation process for
dev-cert-authority, then `stupid-server -s -c $(dev-cert-authority path localdomain.io cert) -k $(dev-cert-authority path localdomain.io key)`


Possibly Askable Questions
==========================

####Why would you build such a thing?
I often just want to fool around with some client-side html/css/js, just to try out an idea. I don't want to jump through hoops to get the code in a browser, but I don't want to use codepen or jsfiddle either, as it may eventually evolve into someting more useful.

####But X other thing already does this
Well, crap. Now I just feel stupid. Thanks.

####Will you add feature Y?
Sure, as long as it's simple enough to set via a command line option.
