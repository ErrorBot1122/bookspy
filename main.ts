/**
 * The stage that the program is currentlly input
 * 
 * ---------------------------------------
 * | Number | **Description**            |
 * |:------:|----------------------------|
 * |   0    | Placeholder                |
 * |   1    | Radio Channal setup        |
 * |   2    | Channal Setup              |
 * |   3    | Setup Complete Placeholder |
 * |   4    | Normal Usage               |
 * ---------------------------------------
 */
let setupMode = 0

/**
 * The current radio channal
 */
let channal = 0

/**
 * If this is reseving signals (true) or sending them (false)
 */
let receiver = false

/**
 * Alows you to skip messeges if true
 */
let debugMode = false

/**
 * If sound is enabled
 */
let isOn = true

/**
 * If an alarm is running
 */
let alarm = 0

/**
 * Placeholder for the last time an occured
 */
let oldAlarm = 0

function swapIsOn() {
    // Flip the sound on or off
    isOn = !isOn

    // If the sound is on, show an volume up symbol
    if (isOn) {

        // Display a volume up symbol
        basic.showLeds(`
            . . # . .
            # # # . #
            # # # . #
            # # # . #
            . . # . .
        `)
    }
    // If the sound is off, show an volume down symbol and turn of eny alarm
    else {

        // Display a volume down symbol
        basic.showLeds(`
            . . # . .
            # # # . .
            # # # . .
            # # # . .
            . . # . .
        `)

        // Turn of the alarm
        alarm = 0
    }

    // Wait 1 second before clearing the screen
    basic.pause(1000)

    // clear the screen
    basic.clearScreen()
}

// Flip the current debug mode when the Mico:Bit is shaken
input.onGesture(Gesture.Shake, function () {

    // Flip the current debug mode
    debugMode = true
})

// Do things when the A button is pressed depending on the setup state
input.onButtonPressed(Button.A, function () {

    // If we are asking if this Mico:Bit is a receiver, flip it to true and show an empty antenna symbol
    if (setupMode == 1) {

        // "Fix" then receiver's value then show a symbol reflecting the change
        receiver = true

        // Display an empty antenna symbol
        basic.showLeds(`
            . . . . .
            . . . . .
            . . # . .
            . . # . .
            . . # . .
        `)
    }

    // If we are asking for the channal group, decrement its channal dispaly the new number
    else if (setupMode == 2) {
        
        // Decrement the channal and update it
        channal -= 1

        // Update the channal then display the new channal number
        radio.setGroup(channal)

        // Display the new channal group
        basic.showNumber(channal)
    }

    // If the setup is done, flip the sound on or off and dispay its corisponding symbol to the screen
    else if (setupMode == 3) {

        // If this receving signals, flip its sound on or off then display its corisponding symbol to the screen
        if (receiver) swapIsOn()
    }
})

// Do things when the B button is pressed depending on the setup state
input.onButtonPressed(Button.B, function () {

    // If we are asking if this Mico:Bit is a receiver, flip it to false and show an empty antenna symbol
    if (setupMode == 1) {

        // "Fix" then receiver's value then show a symbol reflecting the change
        receiver = false

        // Display a sending antenna symbol
        basic.showLeds(`
            . # # # .
            # . . . #
            . . # . .
            . . # . .
            . . # . .
        `)
    }

    // If we are asking for the channal group, increment its channal dispaly the new number
    else if (setupMode == 2) {

        // Increment the channal and update it
        channal += 1

        // Update the channal then display the new channal number
        radio.setGroup(channal)

        // Display the new channal group
        basic.showNumber(channal)
    }
    
    // If the setup is done, flip the sound on or off and dispay its corisponding symbol to the screen
    else if (setupMode == 3) {

        // If this receving signals, flip its sound on or off then display its corisponding symbol to the screen
        if (receiver) swapIsOn()
    }
})

// Do things when the A and B buttons are pressed at the same time depending on the setup state
input.onButtonPressed(Button.AB, function () {
    if (setupMode == 1) {
        setupMode = 0

        basic.clearScreen()

        if (!debugMode) {
            basic.showString("Please Chose A Channal To Brodcast", 75)
        }
        if (!debugMode) {
            basic.showString("B Will Increment, A Will Decrement, A+B Will Confirm.", 75)
        }

        basic.clearScreen()

        basic.showNumber(channal)

        setupMode = 2
    }
    else if (setupMode == 2) {
        basic.clearScreen()

        setupMode = 0

        basic.showString("Setup Complete", 75)

        if (!debugMode) {

            if (receiver) {
                basic.showString("Press A or B to stop or start the alarm, or Press A+B to redo setup", 75)
            }
            else {
                basic.showString("Press A+B to redo setup")
            }
        }

        basic.clearScreen()

        setupMode = 3
    }
    else if (setupMode == 3) {
        setupMode = 0

        radio.setGroup(channal)

        if (!debugMode) {
            basic.showString("Will This Mico:Bit Be A Receiver?", 75)
        }
        if (!debugMode) {
            basic.showString("Press A For Yes, B For No, And A+B to Confirm", 75)
        }

        basic.showLeds(`
            . # # # .
            # . . . #
            . . # . .
            . . # . .
            . . # . .
        `)


        setupMode = 1
    }
})

/*
    Startup section
*/

basic.pause(2000)

radio.setGroup(channal)

if (!debugMode) {
    basic.showString("Will This Mico:Bit Be A Receiver?", 75)
}
if (!debugMode) {
    basic.showString("Press A For Yes, B For No, And A+B to Confirm", 75)
}

basic.showLeds(`
    . # # # .
    # . . . #
    . . # . .
    . . # . .
    . . # . .
`)

setupMode = 1

radio.onReceivedValue(function (name: string, newAlarm: number) {
    console.log(newAlarm)

    if (receiver && setupMode == 3) {
        if (name == 'alarm') {
            if (oldAlarm == 0 && newAlarm == 1) {
                alarm = 1
            }

            oldAlarm = newAlarm
        }
    }

})

basic.forever(function () {

    if (setupMode == 3) {
        if (!receiver) {
            let pinState = (pins.analogReadPin(AnalogPin.P0) <= 250) ? 0 : 11

            console.log(pinState)

            radio.sendValue("alarm", pinState)
        }
    }
    if (receiver) {
        music.setVolume(alarm * +isOn * 255)

        if (alarm) {
            music.playTone(Note.A4, music.beat(BeatFraction.Half) + music.beat(BeatFraction.Quarter))
            music.playTone(Note.A3, music.beat(BeatFraction.Half) + music.beat(BeatFraction.Quarter))
        }
    }
})
