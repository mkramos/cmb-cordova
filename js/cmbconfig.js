/**
* @name : Cmbconfig
* @desc : A class for setting different configuration collections. Start different configuration instances of the scanner
* NOTE:
* Config doesn't need to be implemented in this way.
* This is just one of the possible ways to implement the configuration
* If you are using Angular the config will be implemented differently
*
*/
var Cmbconfig = (typeof Cmbconfig === 'function') ? Cmbconfig : function(scanner){
    if (typeof scanner === 'undefined'){
        console.log('No Scanner object');
        return false;
    }
//reference to the scanner
    this.scanner = scanner;
//connectionState property if the state "changes" from connected to connected, we don't want to do the same action again


//Adding all the symbols that are available to the MX scanner (some of these can not be enabled for the CAMERA scanner)
    this.Symbols = [
          "SYMBOL.DATAMATRIX"
          ,"SYMBOL.QR"
          ,"SYMBOL.C128"
          ,"SYMBOL.UPC-EAN"
          ,"SYMBOL.C11"
          ,"SYMBOL.C39"
          ,"SYMBOL.C93"
          ,"SYMBOL.I2O5"
          ,"SYMBOL.CODABAR"
          ,"SYMBOL.EAN-UCC"
          ,"SYMBOL.PHARMACODE"
          ,"SYMBOL.MAXICODE"
          ,"SYMBOL.PDF417"
          ,"SYMBOL.MICROPDF417"
          ,"SYMBOL.DATABAR"
          ,"SYMBOL.POSTNET"
          ,"SYMBOL.PLANET"
          ,"SYMBOL.4STATE-JAP"
          ,"SYMBOL.4STATE-AUS"
          ,"SYMBOL.4STATE-UPU"
          ,"SYMBOL.4STATE-IMB"
          ,"SYMBOL.VERICODE"
          ,"SYMBOL.RPC"
          ,"SYMBOL.MSI"
          ,"SYMBOL.AZTECCODE"
          ,"SYMBOL.DOTCODE"
          ,"SYMBOL.C25"
          ,"SYMBOL.C39-CONVERT-TO-C32"
          ,"SYMBOL.OCR"
          ,"SYMBOL.4STATE-RMC"
          ,"SYMBOL.IT-DOES-NOT-EXIST-IN-THE-SYMBOL-LIST"
          ,"sdfasfalkjwosadfa"
    ];
//friendly names for the device labels
    this.devices = ["MX Device","Camera Device"];

};




Cmbconfig.prototype.defaultSettings = function(){

//we could use arrow functions to avoid using "me" reference,
//and a few callback functions are done as arrow functions, but most of them are traditional functions
  var me = this;
//get a reference to the status element

  this.dom = new DOM_init(this.scanner);



  this.dom.init();


//For our example let's have a Preview Container positioned on 0,0 (left,top) 100% right and 50% bottom. This only works for the CAMERA Scanner mode
    this.scanner.setPreviewContainerPositionAndSize(0,0,100,50);

//We can send commands to our READER (MX DEVICE or CAMERA) only after we have a valid connection.
//This is the place to handle connect/disconnect code
    this.scanner.setConnectionStateDidChangeOfReaderCallback(function(connectionState){
//lets change the availabilty of the buttons based on the connection state and labels




//If the Reader connects we can start adding some configuration options to it
        if ((connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_CONNECTED)){
//But only if there was a change in the connection sate (we don't want two connect events to fire the same code twice)

          if(me.dom.readerConnected != connectionState){
//Setup an array to hold promises. The callback functions from setSymbologyEnabled, isSymbologyEnabled, sendCommand,
// all return promises
              var promises = [];
//just an object to hold the results from all the logs that we will have after each method finishes
              var return_object = {};
//let's go through all the symbols in our Symbols array and activate them one by one
              me.Symbols.forEach(function(symbol){
//keep all promises in an array so we can do things to our Reader Device after all the stuff we setup is finished
                 promises.push(
//first check if symbologies are enabled.
                    me.scanner.isSymbologyEnabled(symbol).then(function(result){
//we will have a result.status true if the action went through, and false for an error, if there is an error there will be a result.err property
//to read the error from
                        if(result.status){
//those symbols that are enabled would return result.result true
                            var answer = (result.result) ? " : YES" : " : NO";
//log the result
                              console.log(result.action + answer);
//add it to the results object which can be printed in the Promise.all later on
                              return_object.first_isSymbologyEnabled = result;
//if the symbol isn't enabled, let's enabled it
                              if(!result.result){
//notice the return in front of me.scanner.setSymbologyEnabled, we don't have to return it, but then Promise.all
//won't wait for all the actions to finish before resolving to true, so if we care about racing conditions, we should always return the promise
                                return me.scanner.setSymbologyEnabled(symbol,true).then(function(rr){
                                //log the status of the action
                                    if(rr.status)
                                        console.log(rr.action + " : SUCCESS");
                                    else
                                        console.log(rr.action + " : FAILED! " + rr.err);
//add it to the results object
                                      return_object.setSymbologyEnabled = rr;
//after we've enabled the symbologies let's see if they are enabled, just for the fun of it. In a real world app we won't be doing this
                                    return me.scanner.isSymbologyEnabled(symbol).then(function(result){
                                      if(result.status){
                                          var answer = (result.result) ? " : YES" : " : NO";
                                          console.log(result.action + answer);
                                      }
                                      else{

                                          console.log(result.action + " : NO! " + result.err);
                                      }
//and add it to the return_object
                                        return_object.second_isSymbologyEnabled = result;
//finally return the return_object that we have been building through all the promise methods.
                                        return return_object;
                                    });
                                });
                              }
                        } //end if result.status from isSymbologyEnabled
//the symbologies that are not supported by our Reader Device will return an error that will be logged here
                        else
                          console.log(result.action + " : NO! " + result.err);
                      })
                  );
              }); //end forEach

//This will make the app wait untill all the stuff we told the Reader Device to do is finished, so then we can be sure to continue with our configuration
              Promise.all(promises).then(function(results){
//we can check the results from all the actions here (if we care to), results is an array of all the return_object(s)
                  // console.log(JSON.stringify(results));
//after all said and done let's see how we can disable a symbol with a DMCC command
//DMCC commands should be used for controlling the DEVICES, helper methods like setSymbologyEnabled are just wrapper methods that
//use the DMCC commands
//we are going to disable a symbol that we previously set
                    me.scanner.sendCommand("SET SYMBOL.POSTNET OFF")
                            .then(function(result){
//and in the promise let's see what our command did
                              // console.log(JSON.stringify(result));
                            });
//let's not wait for the command to finish before we send a new one
//here we will enable the flash unit and set it to always ON
                   me.scanner.sendCommand("SET LIGHT.INTERNAL-ENABLE ON")
                            .then(function(result){
//if the command is succesful we should have the LIGHT turn ON whenever we start the scanning process
                              // console.log(JSON.stringify(result)); //not printing the logs
                                me.scanner.isLightsOn().then(function(lights_on){
                                  console.log(JSON.stringify(lights_on));
                                });
                            });

                    me.scanner.getDeviceBatteryLevel().then(function(battery_charge){
                      console.log(JSON.stringify(battery_charge));
                    });

//let's call the getConnectionState method again, even though we are connected, Will do this, to show that callbacks are being saved.
//So now we will call without giving a callback function.
//We can do this because we already did call the getConnectionState once (if's furhter down the code) which in the runtime of the app will come before
//this call because we waited for all the promises to finish.
                    me.scanner.getConnectionState().then(function(connectionState){
//so the callback that we set further down will be called (this can be seen in the LOG of the app,
//and the cool thing about it is, that it actually returns a promise so we can chain it and do additional things with our result
                        if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_CONNECTED) {
// console.log('Hey, we are still connected, let\'s do more stuff');
//let's get the device type just for the fun of it
                            me.scanner.sendCommand("GET DEVICE.TYPE").then(function(result){
                                // console.log(JSON.stringify(result));
                            });
//sendCommand will accept a traditional callback too, so whichever form suits you will work
                            me.scanner.sendCommand("GET DATA.RESULT-TYPE",function(result){
                                console.log(JSON.stringify(result));
                            });
//let's set the trigger type (me.dom.triggerType is set to 5 which is continious mode and after a scan we don't close the scanner)
//trigger type :  2 is for auto closing the scanner, the other int values 0,1,3,4 are reserved but not used
                            me.scanner.sendCommand("SET TRIGGER.TYPE "+ me.dom.triggerType,function(result){ console.log(JSON.stringify(result)); });

                            me.scanner.getAvailability().then(function(result){
                              console.log('Availability: ' + result);
                            })
                        }
                    });
              });
          } else {
            console.log('connectionState did not change even though the event was fired');
          }

        } else if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_DISCONNECTED){
//if the Reader device isn't connected we will update the label to "Disconnected"


        }
        else if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_CONNECTING) {
//Perform some action when the DataManSystem object is
//in the process of establishing a connection to a remote system.


        }
        else if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_DISCONNECTING) {
//Perform some action when the DataManSystem object is
//in the process of disconnecting from a remote system.

        }

//Update the connectionState for the DOM elements
      me.dom.readerConnected = connectionState;
//render the dom elements
      me.dom.render();
    });

//Now let's get the connection state.
//Because the scanner is not connected yet, we should see a message in the debug window telling us the READER isn't available!
//But since we "save" our callbacks, the next time we call getConnectionState() without setting a callback this will be reused
    this.scanner.getConnectionState(function(connectionState){
 // connectionState - int representation of the DataManSystem object connection state

        if(!Number.isInteger(connectionState)){
//if connectionState is not a number value, then we have an error, let's show it
            console.log(connectionState);
        }

//we could connection states like this and update the DOM accordingly, but we are using a
//better method of controling the DOM so we will just leave these empty
        if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_DISCONNECTED) {
//Perform some action when the DataManSystem object is not connected to any remote system.
          console.log('The Reader Device is Disconnected');

        }
        else if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_CONNECTING) {
//Perform some action when the DataManSystem object is
//in the process of establishing a connection to a remote system.
          console.log('The Reader Device is Connecting');

        }
        else if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_CONNECTED) {
//Perform some action when the DataManSystem object is connected to a remote system.
          console.log('The Reader Device is Connected');

        }
        else if (connectionState == me.scanner.CONSTANTS.CONNECTION_STATE_DISCONNECTING) {
//Perform some action when the DataManSystem object is
//in the process of disconnecting from a remote system.
          console.log('The Reader Device is Disconnecting');

        }
        me.dom.readerConnected = connectionState;
//render the DOM elements based on the connectionState that we just got
        me.dom.render();
//return the connectionState value so it can be used in the promise
        return connectionState;
    });

//check if scanner is available, if it is connect automatically to it
     this.scanner.setAvailabilityCallback(function(readerAvailability){
           if (readerAvailability == me.scanner.CONSTANTS.AVAILABILITY_AVAILABLE) {
               me.scanner.connect();
           }else{
               me.scanner.disconnect();
           }
       });

//set the callback that's called when start/stop scanning is invoked. Mostly for updating DOM elements
//it will return TRUE in the result if the scanning process is STARTED and false or error message if it's NOT STARTED
       me.scanner.setActiveStartScanningCallback(
         function(result){
//set the scannerActive parameter of the dom helper object
              if(result == true)
                me.dom.scannerActive = result;
              else
                me.dom.scannerActive = false;

              me.dom.render();
              return result; //still returning a promise for chain pruposes
          }
        );

/****
**    After a barcode is found this is the callback function to handle the result
**              setResultCallback
**
****/
        me.scanner.setResultCallback(function(result){
/**
*   Structure of the result object:
*	result.readResults - json array. If you use multicode mode here you will find main result(set of all partial results together merged in one readString) and all other partial results
*	result.subReadResults - json array of all partial results (if single code mode is uset this array will be empty)
*	result.xml - string representation of complete result from reader device in xml format
	
*	result.readResults and result.subReadResults are json arrays that contains items with this structure:
*   item.readString - string representation of barcode 
*   item.symbologyString - string representation of the barcode symbology detected
*	item.goodRead - bool that indicate if barcode is successful scanned
*	item.xml - string representation of partial result in xml format
*	item.imageGraphics - string that represent svg image from last detected frame
*	item.image - base64 string that contain image from last detected frame
*/
             if(result && result.readResults && result.readResults.length > 0){

                 result.readResults.forEach(function (item, index){

                     if (item.goodRead == true) {
//Perform some action on barcode read
//example:
                         document.getElementById('content').insertAdjacentHTML('beforeend','<div class="result"><span class="symbol">'+item.symbologyString+'</span> : '+item.readString+'</div>');
//we could put all this DOM handling in the dom helper object, but since it's just one line of code let's leave it be
                     }
                     else{
//Perform some action when no barcode is read or just leave it empty
           // navigator.notification.alert("Stopped");
                     }
                 });
             }
        });

//if you are going to change the cameraMode, you need to do it before loadScanner is called, otherwise there will be no effect
      this.scanner.setCameraMode(0);
//reffer to our wiki for cameraModes

//if we want to set additional preview options we can do it here
      this.scanner.setPreviewOptions(this.scanner.CONSTANTS.PREVIEW_OPTIONS.NO_ZOOM_BTN | this.scanner.CONSTANTS.PREVIEW_OPTIONS.HARDWARE_TRIGGER);

//if you are going to change the previewOverlayMode, you need to do it before loadScanner is called, otherwise it will not work properly
      this.scanner.setPreviewOverlayMode(this.scanner.CONSTANTS.PREVIEW_OVERLAY_MODE["OM_CMB"]);


//Another way to register SDK with your license key, you need to do it before loadScanner is called
     this.scanner.registerSDK("SDK_KEY");

//load the Reader Device with the chosen Device Type, we will use a mobile device
    this.scanner.loadScanner("DEVICE_TYPE_MOBILE_DEVICE",function(result){
//when the scanner loads we can update the pick device label
        me.dom.deviceType = result.type;
        me.dom.render();
        // document.getElementById('pick-device').innerHTML = "Pick Device (" + me.devices[me.scanner.CONSTANTS.DEVICES.indexOf(result.name)]+")";
        me.scanner.connect();
    });

}

Cmbconfig.prototype.alternativeSettings = function(){
  //if we want to use another set of settings we can put them here...

}

/**
*  HELPER OBJECT
*  For all the DOM manipulations we will use this helper Class.
*  Handles events and change of button actions based on the state of the Connection to the Reader
*  It's a completely custom code relevant only to the this demo app and it's not related to the
*  API functions of the Cordova Plugin
**/

var DOM_init = function(cmb){
  this.scannerActive = false; //if the scanner is active (when TRIGGER is ON )
  this.readerConnected = 0; //state of the connection, disconnected
  this.triggerType  = 5; //
  this.deviceType = 1; //camera device

  this.cmbScanner = cmb;
  this.buttons = {};
  this.labels = {};


}
DOM_init.prototype =  {
    init: function() {
      this.buttons.startBtn = document.getElementById("scanner-btn");
      this.buttons.connectBtn = document.getElementById("connect-btn");
      this.buttons.triggerTypeBtn = document.getElementById('continious-btn');
      this.buttons.pickDevice = document.getElementById('pick-device');
      this.labels.deviceConnection = document.getElementById('device-connection');
	  this.labels.sdkVersion = document.getElementById("sdk-version-value");


      this.buttons.startBtn.addEventListener("click", this, false);
      this.buttons.connectBtn.addEventListener("click",this,false);
      this.buttons.triggerTypeBtn.addEventListener("click",this,false);
      this.buttons.pickDevice.addEventListener("click",this,false);
    },
    handleEvent: function(e) {
        var me = this;
        if(e.type == "click"){
            if(e.target == this.buttons.connectBtn){
              console.log('you are pressing the connectBtn');
              this.connect();
            }
            if(e.target ==  this.buttons.startBtn){
              this.scan();
            }
            if(e.target == this.buttons.triggerTypeBtn){
                  (function(){navigator.notification.confirm("Continuous (doesn't stop the READER after a good READ) and Manual (stops after it finds a barcode)", function(buttonIndex){
                      var selectedTriggerType = buttonIndex * buttonIndex + 1;
                      me.cmbScanner.setTriggerType(selectedTriggerType).then(function(result){
                          console.log(JSON.stringify(result));
                          if(result.status)
                            me.triggerType = result.trigger;
                          else if(result.err){
                            console.log(result.err);
                          }
                          me.render();
                      });

                   }, "Choose", ["Manual","Continuous"]) })()
            }
            if(e.target == this.buttons.pickDevice){

                (function(){navigator.notification.confirm("MX Reader (Cognex hardware as READER) or Camera (uses the smartphone Camera)", function(buttonIndex){

                      me.cmbScanner.loadScanner(buttonIndex-1).then(function(result){
                        if(result.status){
                          me.deviceType = result.type;
                          me.cmbScanner.connect();
                        }
                        me.render();
                    });

                 }, "Choose", ["MX Reader","Camera"]) })()

            }
        }
    },
    render : function(){
      if (this.scannerActive)
          this.buttons.startBtn.className = "btn stop";
      else
        this.buttons.startBtn.className = "btn start";


      this.labels.deviceConnection.className = "event received";

      if (this.readerConnected == this.cmbScanner.CONSTANTS.CONNECTION_STATE_CONNECTED){
        this.buttons.connectBtn.className = "btn disconnect";
        this.labels.deviceConnection.innerHTML = "CONNECTED";
        this.labels.deviceConnection.classList.add("connected");
		this.cmbScanner.getSdkVersion().then(function(version){
            if(version && typeof version === 'string'){
                me.labels.sdkVersion.innerHTML = version;
            }
            else{
                me.labels.sdkVersion.innerHTML = "N/A";
            }
        });
      }
      else if(this.readerConnected == this.cmbScanner.CONSTANTS.CONNECTION_STATE_CONNECTING){
        this.labels.deviceConnection.innerHTML = "CONNECTING";
        this.labels.deviceConnection.classList.add("connecting");

      }
      else if(this.readerConnected == this.cmbScanner.CONSTANTS.CONNECTION_STATE_DISCONNECTING){
        this.labels.deviceConnection.innerHTML = "DISCONNECTING";
        this.labels.deviceConnection.classList.add("disconnecting");

      }
      else if (this.readerConnected == this.cmbScanner.CONSTANTS.CONNECTION_STATE_DISCONNECTED){
        this.buttons.connectBtn.className = "btn connect";
        this.labels.deviceConnection.innerHTML = "DISCONNECTED";
        this.labels.deviceConnection.classList.add("disconnected");
		this.labels.sdkVersion.innerHTML = "";
      }

      if(this.triggerType == 2){
        this.buttons.triggerTypeBtn.className = "btn picker manual";
      }
      else{
        this.buttons.triggerTypeBtn.className = "btn picker continious";
      }

      if(this.cmbScanner.CONSTANTS.DEVICES_FRIENDLY[this.deviceType]){
        this.buttons.pickDevice.innerHTML = "Pick Device [" + this.cmbScanner.CONSTANTS.DEVICES_FRIENDLY[this.deviceType] +"]";
      }

    },
    connect : function(){
      if(this.readerConnected){
          this.cmbScanner.disconnect();
      }
      else{
          this.cmbScanner.connect();
      }

    },
    scan: function() {
        if(this.scannerActive){
            this.cmbScanner.stopScanning();
        }
        else{
            this.cmbScanner.startScanning();
        }
    }
}
