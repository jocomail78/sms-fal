let port;
let writer;
let reader;
let messageCounter = 0;
let leftOrRight = 'msg-left';
let phoneNumber = '';
let smsMessage = '';

let longSmsMessage = '';
let longSmsPhoneNumber = '';

let previousPayload = '';
let previousPayloadCounter = 0;

let messageTemplate = `
<div id="msg-counter-${messageCounter}" class="msg ${leftOrRight}">
    <div class="avatar">
        <img src="https://avatars.dicebear.com/api/micah/${phoneNumber}.svg">
    </div>
    <p class="text">
        ${smsMessage}
    </p>
</div>
`;

if ("serial" in navigator) {
    // The Web Serial API is supported.
    //alert("Serial OK");
} else {
    alert('Serial port wont work with this browser. Please try another one.');
}

$(document).ready(function () {
    $(document).on('change', '#phone-number', function () {
        val = $(this).val();
        $('.header-phone-number').html(val);
    });

    $(document).on('click', '#connection-start', function () {
        requestPort();
    });

    $(document).on('click', '#read', function () {
        read();
    });

    $(document).on('click', '#write', function () {
        write();
    });

    $(document).on('click', '#close', function () {
        close();
    });

    $(document).on('click', '#toggle-controls', function () {
        toggleControls();
    });


    /**
     * CTRL + SPACE to SHOW/HIDE the control buttons - START
     */
    var ctrlPressed = false; //Variable to check if the the first button is pressed at this exact moment
    $(document).keydown(function (e) {
        if (e.ctrlKey) { //If it's ctrl key
            ctrlPressed = true; //Set variable to true
        }
    }).keyup(function (e) { //If user releases ctrl button
        if (e.ctrlKey) {
            ctrlPressed = false; //Set it to false
        }
    }); //This way you know if ctrl key is pressed. You can change e.ctrlKey to any other key code you want

    $(document).keydown(function (e) { //For any other keypress event
        if (e.which == 32) { //Checking if it's space button
            if (ctrlPressed == true) { //If it's space, check if ctrl key is also pressed
                toggleControls(); //Do anything you want
                ctrlPressed = false; //Important! Set ctrlPressed variable to false. Otherwise the code will work everytime you press the space button again
            }
        }
    });

    function toggleControls() {
        console.log('Toggle Controls');
        $('.control-buttons').toggleClass('hidden');
    }

    /**
     * CTRL + SPACE to SHOW/HIDE the control buttons - END
     */
});

async function close() {
    reader.releaseLock();
    writer.releaseLock();
    await port.close();
}

async function write() {
    while (port.writable) {
        if (!writer) {
            writer = port.writable.getWriter();
        }

        try {
            data = new TextEncoder().encode("AT+CMGL=4\r\n");
            await writer.write(data);
            await delay(5000);

            data = new TextEncoder().encode("AT+CMGD=1,1\r\n");
            await writer.write(data);
            await delay(2000);

        } catch (error) {

        }
    }


}

async function requestPort() {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
}

async function read() {
    while (port.readable) {
        if (!reader) {
            reader = port.readable.getReader();
        }

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (value) {
                    var dataFlow = new TextDecoder().decode(value);
                    processDataFlow(dataFlow);
                    // console.log("Next line");
                    // console.log(dataFlow);
                }
                await delay(1000);
            }
        } catch (error) {
            // TODO: Handle non-fatal read error.
        }
    }

}

function processDataFlow(dataFlow) {
    console.log(dataFlow);
    var parts = dataFlow.split('\r\n');
    parts.forEach(function (item) {
        if (item.startsWith("+") || item.startsWith("^")) {
            return;
        }
        if (item.startsWith("079") || previousPayload.length) {
            if (item.startsWith("079") || previousPayloadCounter > 5) {
                previousPayload = "";
                previousPayloadCounter = 0;
            }

            if (previousPayload.length) {
                previousPayloadCounter++;
                console.log('PPL: ' + previousPayload);
                console.log('CI: ' + item);
                item = previousPayload + item;
                console.log('NL: ' + item);
            }

            smsParts = pduDecoder(item);
            console.log(smsParts);
            if (smsParts.length == 12) {
                //long message, we have to combine them
                phoneNumber = smsParts[3].replace('(hideable)Number\t', '');
                smsMessage += smsParts[11].replace('User Data\t', '');
            } else if (smsParts.length == 10) {
                phoneNumber = smsParts[3].replace('(hideable)Number\t', '');
                smsMessage = smsParts[9].replace('User Data\t', '');
            } else {
                previousPayload = item;
                return;
            }

            previousPayload = '';
            previousPayloadCounter = 0;

            if (isNaN(phoneNumber)) {
                return;
            }
            if (!smsMessage.length) {
                return;
            }

            messageCounter++;

            console.log('Message counter: ' + messageCounter);
            console.log(phoneNumber);
            console.log(smsMessage);

            showMessage(smsMessage, phoneNumber, messageCounter);

        }
    });
}

function showMessage(smsMessage, phoneNumber, messageCounter) {
    smsMessage = censure(smsMessage);

    if (messageCounter % 2 == 0) {
        leftOrRight = 'msg-left';
    } else {
        leftOrRight = 'msg-right';
    }

    let messageTemplate = `
    <div id="msg-counter-${messageCounter}" class="msg ${leftOrRight}">
        <div class="avatar">
            <img src="https://avatars.dicebear.com/api/micah/${phoneNumber}.svg">
        </div>
        <p class="text">
            ${smsMessage}
        </p>
    </div>
    `;

    $('.content').prepend(messageTemplate);
    increaseFontSize("#msg-counter-" + messageCounter);
}

function censure(msg) {
    var lower = msg.toLowerCase();
    let beginning = lower;
    let notAllowed =
    {
        "fasz": "traktor",
        "fasszopo": "tancos komikus",
        "buzi": "palacsinta",
        "kurva": "rozsa",
        "dugni": "lapatolni",
        "dug": "sarval",
        "picsa": "makaroni",
        "segg": "kosztum",
        "szopik": "himez",
        "szop": "fog",
        "basz": "kapal",
        "bassz": "kapalj",
        "pina": "hagyma",
        "pula": "piciorul",
        "fut": "arunc",
        "cur": "minge",
    }

    Object.entries(notAllowed).forEach(entry => {
        const [key, value] = entry;
        if (lower.includes(key)) {
            lower = lower.replace(key, value);
        };
    });
    if (beginning !== lower) {
        return lower;
    }
    return msg;

}

function censureOld(msg) {

    msg = msg.replace("fasz", "traktor");
    msg = msg.replace("fasszopo", "tancos komikus");
    msg = msg.replace("buzi", "palacsinta");
    msg = msg.replace("geci", "szilvasgomboc");
    msg = msg.replace("kurva", "rozsa");
    msg = msg.replace("dugni", "lapatolni");
    msg = msg.replace("dug", "sarval");
    msg = msg.replace("picsa", "makaroni");
    msg = msg.replace("yolo", "Why yo no loco?");
    msg = msg.replace("segg", "kosztum");
    msg = msg.replace("szopik", "himez");
    msg = msg.replace("szop", "fog");
    msg = msg.replace("basz", "kapal");
    msg = msg.replace("bassz", "kapalj");
    msg = msg.replace("pina", "hagyma");
    msg = msg.replace("pula", "piciorul");
    return msg;
}

function increaseFontSize(blockId) {
    baseFontSize = 25;
    iteration = 0;
    height = $(blockId).outerHeight();
    do {
        iteration++;
        baseFontSize += 2;
        $(blockId + ' .text').css('font-size', baseFontSize + 'px');
        newHeight = $(blockId).outerHeight();
    } while ((newHeight <= height) && (iteration < 80));
    baseFontSize -= 2;
    $(blockId + ' .text').css('font-size', baseFontSize + 'px');
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}