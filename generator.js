// note that this program works with an 11x11 grid with borders at the edge
// the play space is the 9x9 grid within, so indexes for those may start at 1

class NoodleObject{
	constructor(icon,length,start,end){
		this.icon= icon;
		this.length = length;
		this.start = start;
		this.end = end;
	}
}

// returns random integer between min (inclusive) and maximum (inclusive) 
function get_random_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Randomize array in-place using Durstenfeld shuffle algorithm
function shuffle_array(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function min_distance(start,end){
	return (Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]));
}

//returns strings in adjacent cells in order [below,above,right,left]
function get_adjacent(grid,row,column){ 
	return [grid[row + 1][column],grid[row - 1][column],grid[row][column + 1],grid[row][column - 1]];
}

//returns list of strings of unique numbers adjacent to cell in descending order
function get_adjacent_num(grid,row,column){ 
    let nums = [];
    let adjCells = get_adjacent(grid,row,column);
    for (let i = 0;i<4;i++){
        // if cell is a number AND is not already in array
        // for some reason " " is considered a number so theres the extra check in there
        if((!isNaN(adjCells[i]) && (adjCells[i] != " ")) && (!nums.includes(adjCells[i]))){
            nums.push(adjCells[i]);
        }
    }
    //sorts in descending order
    nums.sort();
    nums.reverse();
    return nums;
}

// returns a list of the size of each "gap" in the grid (groups of " " spaces adjacent to each other)
// adjacent being up right left down
function count_gaps(grid){
    let tempGrid = structuredClone(grid);
    let nextNum = 0;
    //list of strings of numbers currently on the grid
    let finalNums = [];
    //tracks how much the number of the same index in finalNums is used
    let numCounts = []; 
    for (let i = 1; i < 10; i++){
        for (let j = 1; j < 10; j++){
            //skips over non empty spaces
            if (tempGrid[i][j] != " "){
                continue
            }
            let adjNums = get_adjacent_num(tempGrid,i,j);
            //if no adjacent numbers, uses a new one
            if (adjNums.length == 0){
                tempGrid[i][j] = String(nextNum);
                finalNums.push(String(nextNum));
                numCounts.push(1)
                nextNum = nextNum + 1;
            // if one number adjacent, uses that
            } else if (adjNums.length == 1) {
                tempGrid[i][j] = adjNums[0];
                // updates count of that number in numCounts
                let numIndex = finalNums.indexOf(adjNums[0]);
                numCounts[numIndex] = numCounts[numIndex] + 1;
            } else {
                //takes lowest number from adjacent numbers
                let remainNum = adjNums.pop();
                //changes current tile to the lower number and updates the count
                tempGrid[i][j] = remainNum;
                let remainIndex = finalNums.indexOf(remainNum);
                numCounts[remainIndex] = numCounts[remainIndex] + 1;

                //removes other numbers from the list of used numbers
                for (let k = 0; k < adjNums.length; k++){
                    let numIndex = finalNums.indexOf(adjNums[k]);
                    finalNums.splice(numIndex,1);
                    numCounts.splice(numIndex,1);
                }
                //remainIndex = finalNums.indexOf(remainNum);
                //replaces said numbers with the lowest one
                for (let k = 1; k <= i; k++){
                    for (let l = 1; l <= 9; l++){
                        if (adjNums.includes(tempGrid[k][l])){
                            tempGrid[k][l] = remainNum;
                            numCounts[remainIndex] = numCounts[remainIndex] + 1;
                        }
                    }
                }
            }
        }
    }
    return numCounts;
}

// returns [[list of sums], list of combinations [4,4,6,etc] at corresponding index]
// note affects original list
function get_combinations_recur(lengthList){
    if (lengthList.length == 0){
        return [[0],[[]]];
    }
    let current = lengthList.pop();
    let otherCombs = get_combinations_recur(lengthList);
    let allCombs = [otherCombs[0].concat(otherCombs[0].map(n => n + current)),otherCombs[1].concat(otherCombs[1].map(x => x.concat([current])))];
    return allCombs;

}

// returns [[list of sums], list of combinations [4,4,6,etc] at corresponding index]
// does not affect original list
// does not include the zero sum
function get_combinations(lengthList){
    let tempList = structuredClone(lengthList);
    let results = get_combinations_recur(tempList);
    // removes the 0 combination (and corresponding [] used to sum to it)
    results[0].shift();
    results[1].shift();
    return results;
}

// returns true if the integers in lengthList can be summed to create the integers in gapList
// (otherwise false)
// each integer in lengthList only being used once
// works recursively, picking one gap seeing if it can be summed with the lengths
// ... then repeating with the remaining gaps and lengths
function still_fillable(gapList,lengthList){
    // if all lengths are used, it is fillable (terminating case for recursion)
    if (lengthList.length == 0){
        return true
    }
    let remainingGaps = structuredClone(gapList);
    let gap = remainingGaps.pop();
    let combinations = get_combinations(lengthList);
    let valid = [];
    // if it is not possible to fill the current gap with the remaining lengths
    // returns false (not still fillable)
    if (!combinations[0].includes(gap)){
        return false;
    // gets every combination of lengths that can fill said gap
    } else {
        for (let i = 0; i < combinations[0].length; i++){
            if (combinations[0][i] == gap){
                valid.push(combinations[1][i]);
            }
        }
    }
    // for each combination, repeats the function with the remaining gaps and lengths
    // if any of them are true, then it is still fillable
    // if not, then it is not
    let fillable = false;
    for (let i = 0; i < valid.length; i++){
        // comb is a list of integers that add to the current gap
        let comb = valid[i]
        let remainingLengths = structuredClone(lengthList);
        // removes all numbers in comb from the list of lengths
        for (let j = 0; j < comb.length;j++){
            let numIndex = remainingLengths.indexOf(comb[j]);
            remainingLengths.splice(numIndex,1);
        }
        if (still_fillable(remainingGaps,remainingLengths)){
            fillable = true;
        }
    }
    return fillable;
}

// returns [grid with noodle placed,[start row, start column],[end row, end column]]
// does not affect original grid
// noodle is in form ["string to put on grid",length integer]
// turn change is probability (between 0 and 1) to turn regardless of reaching a dead end
function place_noodle(inputGrid,noodle,turnChance=0.25,straightLimit = 81){
    let grid = structuredClone(inputGrid);
    // icon: string that will be filled into the grid
    let icon = noodle[0];
    // amount of times a cell needs to be randomly picked and added to noodle
    // (-1 because start is placed automatically)
    let lengthLeft = noodle[1] - 1;
    // cell: two element array [row number, column number]
    let cell = [];


    // finding a cell to start the noodle at
    // randomly picks until it is empty
    let foundEmpty = false;
    while (!foundEmpty){
        cell = [get_random_int(1,9),get_random_int(1,9)];
        if (grid[cell[0]][cell[1]] == " "){
            foundEmpty = true;
        }
    }
    let start = cell;
    grid[start[0]][start[1]] = icon;

    // the direction that the noodle moved in most recently
    // exists so that the noodle can have a modified probability to keep going in the same direction
    // starts random because there is no preferred direction from the single initial cell
    // 0123 = down, up, right, left
    let direction = get_random_int(0,3);
    // will redefine this on first iteration of loop
    let initDirection = "unset";
    let hasTurned = false;

    while (lengthLeft > 0){
        // list of the [row,col] coordinates of the cells adjacent to the current one
        // [below,above,right,left]
        let adjacentCells = [[cell[0]+1,cell[1]],[cell[0]-1,cell[1]],[cell[0],cell[1]+1],[cell[0],cell[1]-1]];
        // same as above, but for the corresponding strings in those cells
        let adjacentTiles = get_adjacent(grid,cell[0],cell[1]);
        // fails the attempt if no adjacent empty spaces
        // i.e. It has reached a dead end
        if (!adjacentTiles.includes(" ")){
            return false
        }
        // check for whether to change direction
        // so if:
        // 1. the tile ahead is NOT empty
        // 2. the random roll to change direction succeeds
        if ((adjacentTiles[direction] != " ") || (Math.random() < turnChance)){
            direction = get_random_int(0,3);
            while (adjacentTiles[direction] != " "){
                direction = get_random_int(0,3);
            }
        }
        // moves to the cell in the selected direction
        cell = adjacentCells[direction];
        grid[cell[0]][cell[1]] = icon;
        lengthLeft = lengthLeft - 1;

        // checks to see if a turn has been made
        // this is used to disallow compeltely straight noodles
        if (initDirection == "unset"){
            initDirection = direction;
        } else if (direction != initDirection) {
            hasTurned = true;
        }
    }
    // end is [row,column] of final cell the noodle fills
    let end = cell;

    // STRAIGHT LINE PROTECTION:
    // if it is above the given length and has not turned, rejects it (returns false)
    if ((!hasTurned) && (noodle[1] > straightLimit)){
        return false;
    }

    // 180 PROTECTION: if the start or end have more than 1 noodle cell adjacent, rejects it (returns false)
    let startAdjacent = get_adjacent(grid,start[0],start[1]);
    let endAdjacent = get_adjacent(grid,end[0],end[1]);
    // if the last index doesnt equal the first index, that means theres more than one of them
    // we know theres at least once adjacent to both the start and end
    // ... so they wont be equal by both failing
    if (startAdjacent.indexOf(icon) != startAdjacent.lastIndexOf(icon)){
        return false;
    }
    if (endAdjacent.indexOf(icon) != endAdjacent.lastIndexOf(icon)){
        return false;
    }

    return [grid,start,end];
}

function show_grid(grid){
	for (let i = 0; i < grid.length; i++){
		console.log(String(grid[i]))
	}
}

function are_arrays_equal(array1,array2){
	if (array1.length != array2.length){
		return false;
	}
	for (let i = 0; i<array1.length; i++){
		if (array1[i] != array2[i]){
			return false;
		}
	}
	return true;

}

//returns a list of grids with the path filled in
//does not affect original grid
function find_paths(grid,start,end,movesLeft,icon){ 
	let foundPaths = [];
	let currentGrid = structuredClone(grid);
    let adjacentTiles = [[(start[0] + 1),start[1]],[(start[0] - 1),start[1]],[start[0],(start[1] + 1)],[start[0],(start[1] - 1)]]; //down, up , right, left
	currentGrid[start[0]][start[1]] = String(movesLeft) + icon;
	if (movesLeft == 0){ //if it is out of moves, correct if at the end, incorrect otherwise
		if (are_arrays_equal(start,end)){
			return [currentGrid];
		}else{
			return [];
		}
	}
	for (let i = 0; i < 4; i++){
		let newCell = adjacentTiles[i];
		if ((min_distance(newCell,end) <= (movesLeft - 1)) && ((currentGrid[newCell[0]][newCell[1]] == " ") || are_arrays_equal(newCell,end))){ //if its not too far from the goal and the space is empty/the goal
			foundPaths = foundPaths.concat(find_paths(currentGrid,newCell,end,(movesLeft - 1),icon)); //gets paths from the new cell to the end
		}
	}
	return foundPaths;
}

// returns a list of grids of each possible way to fill the given grid with the given noodles
// inNoodles a list of noodle objects
// grid must have the start and end of each noodle blocked with an "X"
// does not affect original list
// if it fails, returns false
// solverTimeout is time in seconds
// ... if it takes longer than that to do 1% of the grids, it stops and fails
function solve_noodles(grid,inNoodles,solverTimeout = 0.02){
	let finalGrids = [];
    let noodles = structuredClone(inNoodles);
    // gets the longest noodle from the list first
	let currentNoodle = noodles.reduce((prev, current) => (prev && prev.length > current.length) ? prev : current);
    // removes the selected noodle from the list
	noodles = noodles.filter(function(item){return (item != currentNoodle)});
	let start = currentNoodle.start;
	let end = currentNoodle.end;
	let movesLeft = currentNoodle.length - 1;
	let icon = currentNoodle.icon;
    //if there are no other noodles, uses the starting grid
	if (noodles.length == 0){ 
		return find_paths(grid,start,end,movesLeft,icon);
	}
    //if there are other noodles, puts them on the grid first
	let partialGrids = solve_noodles(grid,noodles); 
    // if that layer fails, e.g. took too long, this layer fails too
    if (partialGrids == false){
        return false
    }
    // otherwise, tries to place the noodle on each grid with all the other noodles placed on it
	let gridsToCheck = partialGrids.length;
    let startTime = Date.now()*1000;
	console.log(gridsToCheck);
	for(let i = 0;i<gridsToCheck;i++){
        // if theres a lot of grids to check and its 1% through them, checks time taken
        // if time taken is longer than solverTimeout, fails (returns false)
        if ((gridsToCheck >= 100) && (i == Math.floor(gridsToCheck/100))){
            if (((Date.now()*1000) - startTime) > solverTimeout){
                console.log((Date.now()*1000) - startTime);
                return false
            }
        }
		finalGrids = finalGrids.concat(find_paths(partialGrids[i],start,end,movesLeft,icon));
	}
    return finalGrids;
}

// returns solved grid if the given grid and noodles has exactly 1 solution, else false
// does not affect original grid
// noodles is a list of noodle objects
// solverTimeout is time in seconds
// ... if it takes longer than that to do 1% of the grids, it stops and fails (returns false)
function is_unique(grid,noodles,solverTimeout = 0.02){
    let inputGrid = structuredClone(grid);
    
    // puts a "X" block at each noodle start and end so they dont accidentally path through each other
    for (let i = 0; i < noodles.length; i++){
        let start = noodles[i].start;
        let end = noodles[i].end;
        inputGrid[start[0]][start[1]] = "X";
        inputGrid[end[0]][end[1]] = "X";
    }

    let solverResult = solve_noodles(inputGrid,noodles,solverTimeout);
    if (solverResult == false){
        console.log("Solver timed out");
        return false
    } else if (solverResult.length != 1){
        console.log("Solution not unique")
        return false
    } else {
        return solverResult[0];
    }
}

// doesnt affect the input grid
// randomly places a noodle, then does does checks to see if the puzzle is still finishable
// if not, returns false
// if yes, then repeats with the next noodle until completion
// inputNoodles list of ["string to put on grid", length]
function try_generate_puzzle(inputGrid,inputNoodles,turnChance = 0.25,tryCap = 100,solverTimeout=0.02,straightLimit=81){
    let grid = structuredClone(inputGrid);
    let finalNoodles = [];
    let noodles = structuredClone(inputNoodles);
    shuffle_array(noodles);
    // lengths of the noodles at the corresponding indexes to the noodles
    let remainingLengths = noodles.map(x => x[1]);
    
    while (noodles.length > 0){
        let noodle = noodles.pop();
        remainingLengths.pop();
        // count is amount of attempts to place a noodle
        // if it reaches tryCap, then it fails (returns false)
        let count = 0;
        let validTry = false;
        let noodleResult = [];

        while ((!validTry) && (count < tryCap)){
            noodleResult = place_noodle(grid,noodle,turnChance,straightLimit);
            validTry = true;
            if (noodleResult == false){
                validTry = false;
            } else if (!still_fillable(count_gaps(noodleResult[0]),remainingLengths)){
                validTry = false;
            }
            count = count + 1;
        }

        if (count == tryCap){
            //console.log("Timed out at noodle " + noodle[0]);
            return false
        }

        // if noodle is placed successfully:
        grid = noodleResult[0];
        finalNoodles.push(new NoodleObject(noodle[0],noodle[1],noodleResult[1],noodleResult[2]));
    }

    // once all noodles have been placed on the grid
    let uniqueResult = is_unique(inputGrid,finalNoodles,solverTimeout);
    if (uniqueResult == false){
        return false
    }

    console.log("Found Solution");
    return [uniqueResult,finalNoodles];
}

// returns a unique puzzle according to the input parameters
// does not affect input grid
// input grid a 11x11 with "X" at edges, and any additional cells blocked
// inputNoodles is a list of ["string to fill into grid"]
// turn chance is chance for noodle to turn regardless of reaching dead end
// try cap is amount of times to try place a noodle before giving up
// solver timeout is maximum time taken to check 1% of the grids when solving before giving up
function generate_puzzle(inputGrid,inputNoodles,turnChance = 0.25,tryCap = 100,solverTimeout=0.02,straightLimit = 81){
    let result = false;
    while (result == false){
        result = try_generate_puzzle(inputGrid,inputNoodles,turnChance,tryCap,solverTimeout,straightLimit);
    }
    return result;
}

function worker_called(genParams){
    console.log("Input checks passed");
    let coloursList = ["red","orange","yellow","green","blue","purple","hotpink","lightblue","limegreen","cyan","maroon","orchid","tan","darkslategray","goldenrod","seagreen","slategray","teal","saddle brown","lavender"];
    //let initGrid = [["X","X","X","X","X","X","X","X","X","X","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X"," "," "," "," "," "," "," "," "," ","X"],["X","X","X","X","X","X","X","X","X","X","X"]];
	let noodleList = [];
    let lengthsList = genParams[0];
    let turnChance = genParams[1];
    let initGrid = genParams[2];
    let straightLimit = genParams[3];
    console.log(genParams);
    for (let i = 0; i < lengthsList.length; i++){
        noodleList.push([coloursList[i],lengthsList[i]]);
    }
    let puzzle = generate_puzzle(initGrid,noodleList,turnChance,1000,0.02,straightLimit);
    postMessage(puzzle);
}


//runs when worker.postMessage() is ran in main code
onmessage = function(genParams){
    console.log(genParams.data);
    worker_called(genParams.data)
}




//-----=====MAIN PROGRAM=====-----


//worker_called();

/*
if(window!=self){
    worker_called();
}





let row01 = ["X","X","X","X","X","X","X","X","X","X","X"];
let row02 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row03 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row04 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row05 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row06 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row07 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row08 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row09 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row10 = ["X"," "," "," "," ","X"," "," "," "," ","X"];
let row11 = ["X","X","X","X","X","X","X","X","X","X","X"];

let initGrid = [row01,row02,row03,row04,row05,row06,row07,row08,row09,row10,row11];


test_me();

*/

