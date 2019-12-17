//run css animations with javascript
function animateCSS(element, animationName, callback) {
    const node = document.querySelector(element)
    node.classList.add('animated', 'fastest', animationName)

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}

//adds additional 0 to timer text
function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}

//generates combination to unlock letter
//checks to make sure it hasn't been used before
var comboList = [];
function generateLetterCombo(max, alphabet) {
    let combo = [];
    let modAlphabet = alphabet.slice(0, max);
    let randomIndex = 0;

    do {
        combo = [];

        randomIndex = Math.floor(Math.random() * modAlphabet.length);
        combo.push(modAlphabet[randomIndex]);

        modAlphabet.splice(randomIndex, 1);

        randomIndex = Math.floor(Math.random() * modAlphabet.length);
        combo.push(modAlphabet[randomIndex]);

        combo.sort();
    }
    while(comboList.indexOf(combo.join("")) >= 0);

    comboList.push(combo.join(""));
    
    return combo;
}

//each letter is its own viewmodel
var abcItemViewModel = function(item, index, alphabet) {
    let self = this;
    self.letter = item;
    if(index > 1) {
        self.found = ko.observable(false);
        self.combo = generateLetterCombo(index, alphabet);
        self.string = self.combo.join("");
    } else {
        self.found = ko.observable(true);
        self.combo = [];
    }
    self.clicked = ko.observable(false);
}

//core of the game
var abcGameViewModel = function() {
    let alphaString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let self = this;
    self.alphabet = ko.observableArray([]);
    self.comboHistory = ko.observableArray([]);
    self.comboA = ko.observable("?");
    self.comboB = ko.observable("?");
    self.comboRes = ko.observable("");
    self.timerSeconds = ko.observable("00");
    self.timerMinutes = ko.observable("00");
    self.timer = ko.observable("");
    self.count = ko.observable(2);
    self.clicks = ko.observable(0);

    //cause im slack split string of alphabet characters
    self.createLetters = function() {
        let alphaSplit = alphaString.split("");
        let mappedLetters = alphaSplit.map( 
            function(item, index) { 
                return new abcItemViewModel(item, index, alphaSplit);
            }
        );
        self.alphabet(mappedLetters);
    }
    self.createLetters();
    
    //when two letters are selected add to combination to check
    self.setCombo = function(item) { 
        if(item.found() == true && item.clicked() == false){
            self.clicks(self.clicks() + 1);
            switch (self.clicks()) {
                case 1:
                    self.comboA(item.letter);
                    item.clicked(true);
                    animateCSS('.combo-a', 'slideInDown');
                    break;
                case 2:
                    self.comboB(item.letter);
                    item.clicked(true);
                    animateCSS('.combo-b', 'slideInDown');
                    self.checkCombo();
                    break;
                default:
                    break;
                    //if play clicks while animating continue game
                    console.log('Extra clicks');
                    self.unlock();
                    self.reset();
                    self.comboA(item.letter);
                    item.clicked(true);
                    animateCSS('.combo-a', 'slideInDown');
                    break;
            }
        } else {
            //letter not found yet (make button shake?)
        }
    };

    //check if combo matchers do some sick animations and icnrease coutners
    self.checkCombo = function() {
        let query = [self.comboA(), self.comboB()];
        let result = self.searchResults(query.sort().join(""));
        var resultString = self.comboA() + " + " + self.comboB();

        if (result >= 0) {
            let resultVal = self.alphabet()[result];

            resultVal.found(true);
            self.comboRes(" = " + resultVal.letter);
            animateCSS('.combo-res', 'fadeInUp', function() {
                setTimeout(function(){
                    animateCSS('.equation', 'bounceOutRight', function() {
                        self.comboHistory.unshift(resultString  + " = " + resultVal.letter);
                        self.reset();

                        self.count(self.count() + 1);
                        animateCSS('.letters-count', 'pulse');

                        if(self.count() === 3) {
                            self.startTimer();
                        }
                        if(self.count() == self.alphabet().length) {
                            self.stopTimer();
                            var modal = document.getElementById("endModal");
                            modal.style.display = "block";
                        }
                    });
                }, 100);
            });
        } else {
            setTimeout(function(){
                animateCSS('.equation', 'fadeOutDown', function() {
                        self.comboHistory.unshift(resultString);
                        self.reset();
                });
            }, 100);
        }
    };

    //search array to see if query matches
    self.searchResults = function(query) {
        return self.alphabet().findIndex(function(item) {
            if (item.combo && item.found() == false) {
                return item.string == query;
            }
        });
    };

    //reset combo params
    self.reset = function() {
        if( self.comboA() != "?" && self.comboB() != "?" ) {
            self.clicks(0);
            self.comboA("?");
            self.comboB("?");
            self.comboRes("");
            self.unlock();
        }
    };

    self.unlock = function() {
        self.alphabet().forEach(function(item) {
            item.clicked(false);
        });
    };

    //restart the game
    self.restart = function() {
        location.reload();
    }

    //timer controls
    self.startTimer = function() {
        let timerCount = 0;
        self.timer = setInterval(function() {
            timerCount++;
            self.timerSeconds(pad(timerCount % 60));
            self.timerMinutes(pad(parseInt(timerCount / 60)));
        }, 1000);
    }
    self.stopTimer = function() {
        clearInterval(self.timer);
    };
}

ko.applyBindings(new abcGameViewModel());