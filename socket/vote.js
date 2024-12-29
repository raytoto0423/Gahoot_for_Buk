let votes = [0, 0]
let voted_acc = []
let vote_started = false

function vote(vote_number = -1, acc) {
    if (vote_number === 1) votes[0] = votes[0] + 1
    else if (vote_number === 2) votes[1] = votes[1] + 1
    else throw error('invalid vote number: ' + vote_number)

    voted_acc.push(acc)
}

function get_vote() { return [votes, voted_acc.length] }

function acc_exist(acc) { return voted_acc.indexOf(acc) > -1 } // indexOf 함수는 없으면 -1 반환

function reset_vote() {
    votes = [0, 0]
    voted_acc = []
}

module.exports = {
    vote,
    get_vote,
    reset_vote,
    acc_exist,
    vote_started
}