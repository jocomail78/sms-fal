let port;
let writer;
let reader;
if ("serial" in navigator) {
    // The Web Serial API is supported.
    alert("Serial OK");
}

$(document).ready(function(){
    $(document).on('click','#connection-start',function(){
        requestPort();
        console.log(port);
    });

    $(document).on('click','#read',function(){
        read();
    });

    $(document).on('click','#write',function(){
        write();
    });

    $(document).on('click','#close',function(){
        close();
    });


    /**
     * CTRL + SPACE to SHOW/HIDE the control buttons
     */
    var ctrlPressed = false; //Variable to check if the the first button is pressed at this exact moment
    $(document).keydown(function(e) {
      if (e.ctrlKey) { //If it's ctrl key
        ctrlPressed = true; //Set variable to true
      }
    }).keyup(function(e) { //If user releases ctrl button
      if (e.ctrlKey) {
        ctrlPressed = false; //Set it to false
      }
    }); //This way you know if ctrl key is pressed. You can change e.ctrlKey to any other key code you want

    $(document).keydown(function(e) { //For any other keypress event
      if (e.which == 32) { //Checking if it's space button
        if(ctrlPressed == true){ //If it's space, check if ctrl key is also pressed
          myFunc(); //Do anything you want
          ctrlPressed = false; //Important! Set ctrlPressed variable to false. Otherwise the code will work everytime you press the space button again
        }
      }
    })
});

async function close(){
    reader.releaseLock();
    writer.releaseLock();
    await port.close();
}

async function write(){
    if(!writer){
        writer = port.writable.getWriter();
    }

    try{
        data = new TextEncoder().encode("AT\r\n");
        await writer.write(data); 
    }catch(error){

    }

}

async function requestPort(){
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
}

async function read(){
    while (port.readable) {
        reader = port.readable.getReader();
      
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (value) {
                    var string = new TextDecoder().decode(value);
                    console.log(string);
                }
                await delay(1000);
            }
        } catch (error) {
          // TODO: Handle non-fatal read error.
        }
    }
    
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }