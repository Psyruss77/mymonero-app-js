// Copyright (c) 2014-2017, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const EventEmitter = require('events')
//
const PROTOCOL_PREFIX = "monero" // this is also specified for MacOS in packager.js under scheme
// maybe support "mymonero" too
//
class URLOpeningController extends EventEmitter
{
	//
	// Lifecycle - Init
	constructor(options, context)
	{
		super() // must can before accessing `this`
		const self = this
		self.options = options
		self.context = context
		self.setup()
	}
	setup()
	{
		const self = this
		self._startObserving()
	}
	_startObserving()
	{
		const self = this
		const app = self.context.app
		app.on('will-finish-launching', function()
		{ // ^ we might not need to do this
			app.on("open-url", function(event, url)
			{
				self.__didReceivePossibleURIToOpen(
					url,
					function()
					{
						event.preventDefault()
					}
				)
			})
			app.on('launched-duplicatively', function(argv)
			{ // main window listens for this too - and brings itself to forefont…
				// we need to listen for this here for Windows (not MacOS)
				self._didLaunchOrReOpenWithArgv(argv)
			})
			app.setAsDefaultProtocolClient(PROTOCOL_PREFIX) // this seems to be mainly necessary for Windows
		})
		setTimeout(function()
		{
			self._didLaunchOrReOpenWithArgv(process.argv)
		})
	}
	//
	// Runtime - Accessors - Event Names
	EventName_ReceivedURLToOpen_FundsRequest()
	{
		return "EventName_ReceivedURLToOpen_FundsRequest"
	}
	//
	// Delegation - URL reception, launch handling
	__didReceivePossibleURIToOpen(possibleURI, willConsiderAsURI_fn)
	{
		willConsiderAsURI_fn = willConsiderAsURI_fn || function() {}
		const self = this
		if (possibleURI.indexOf(PROTOCOL_PREFIX+":") !== 0) {
			const {dialog} = require('electron')
			dialog.showMessageBox({
				"message": "Sorry, that does not appear to be a valid Monero URL."
			})
			return
		}
		const url = possibleURI // we'll suppose it is one
		self.emit( // and yield
			self.EventName_ReceivedURLToOpen_FundsRequest(), 
			url
		)
	}
	_didLaunchOrReOpenWithArgv(argv)
	{
		const self = this
		const isMacOS = process.platform === "darwin"
		if (isMacOS == true) { // as we handle this with open-url
			return
		}
		if (argv.length <= 1) { // simply launched, no args
			return
		}
		const possibleURI = argv[1]
		self.__didReceivePossibleURIToOpen(possibleURI) // patch to URI reception handler
	}
}
module.exports = URLOpeningController