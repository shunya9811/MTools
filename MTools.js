let CLIOutputDiv = document.getElementById("shell");
let CLITextInput = document.getElementById("shellInput");

CLITextInput.addEventListener("keyup", (event) => {outputCommand(event)});

function outputCommand(event){
    // 押したキーが'return/enter'キーの場合のみ
    if (event.key == "Enter"){
        // 入力されたテキストを解析して、"packageName commandName arguments "
        //を表す3つの文字列要素の配列にします。
        let parsedCLIArray = MTools.commandLineParser(CLITextInput.value);

        // 入力されたテキストがCLIにechoされます。 
        MTools.appendEchoParagraph(CLIOutputDiv);

        // 提出後、テキストフィールドをクリアにします。
        CLITextInput.value = '';
        
        // 入力の検証を行い、 {'isValid': <Boolean>, 'errorMessage': <String>} の形をした連想配列を作成します。
        let validatorResponse = MTools.parsedArrayValidator(parsedCLIArray);
        if(validatorResponse['isValid'] == false) MTools.appendResultParagraph(CLIOutputDiv, false, validatorResponse['errorMessage']);

        else MTools.appendResultParagraph(CLIOutputDiv, true, MTools.evaluatedResultsStringFromParsedCLIArray(parsedCLIArray));
        
        // 出力divを常に下にスクロールします。 
        CLIOutputDiv.scrollTop = CLIOutputDiv.scrollHeight;
    }
}


class MTools{

    static commandLineParser(CLIInputString)
    {
        let parsedStringInputArray = CLIInputString.trim().split(" ");
        return parsedStringInputArray;
    }

    /*
        StringArray parsedStringInputArray : " "で分割されて文字列の配列(トークンと呼ばれる)に
        なった元のコマンドライン入力。return AssociativeArray : {'isValid': <Boolean>, 
        'errorMessage': <String>} の形。ここでは、'isValid'はコマンドラインからの入力が
        有効な場合には真、無効な場合には偽となります。
        返される連想配列は、与えられた文字列配列が有効なトークンに対するMToolsのルールに
        従っているかどうかに応じて、'isValid'キーに対してtrueあるいはfalseを返すことができます。
        入力が有効でない場合は、errorMessageが設定されます。

        このメソッドは、最初にすべてのコマンドのエラーをチェックし、入力がそのチェックを通過した場合、
        余分な制約（例えば、0で除算することができない等）がある場合には、
        各コマンドに対して固有のエラーをチェックします。

        入力検証(universal, commandArguments)の各レベルには個別のチェックが含まれていますが、
        ここでは参考までにすべてのチェックのリストを示しています。
            - 総トークン数は3である必要があります。
            - packageNameを表す最初のトークンは、"MTools"である必要があります。
            - commandNameを表す2番目のトークンは、以下のいずれか1つだけになります
            : {add"、"subtract"、"multiply"、"divide"、"exp"、"log"、"abs"、"sqrt"、"round"、"ceil"、"floor"}

            - 引数を表す第三のトークンは、変換された数値を、","で分割することで、
            さらに解析できるようにする必要があります。
            - 第二のトークンが {"abs", "round", "ceil", "floor", "sqrt"}の場合、1つの引数だけ与えられます。
            - 第二のトークンが　{"add", "subtract", "multiply", "divide", "exp", "log"}の場合、
            2つの引数が与えられます。

            - 第二のトークンが'divide'の場合、第二引数は0となってはいけません。
            - 第二のトークンが'sqrt'の場合、引数は負の数となってはいけません。
            - 第二のトークンが'log'の場合、第一引数は1より大きく、第二引数は正の数でなければなりません。
    */

    static parsedArrayValidator(parsedStringInputArray)
    {
        // すべてのコマンドに適用されるルールに照らし合わせて入力をチェックします。
        let validatorResponse = MTools.universalValidator(parsedStringInputArray);
        if (!validatorResponse['isValid']) return validatorResponse;
      
        // 入力が最初のvalidatorを通過した場合、どのコマンドが与えられたかに基づいて、
        // より具体的な入力の検証を行います。
        validatorResponse = MTools.commandArgumentsValidator(parsedStringInputArray.slice(1,3));
        if (!validatorResponse['isValid']) return validatorResponse;

        return {'isValid': true, 'errorMessage':''}
    }

    /*
        StringArray parsedStringInputArray : " "で分割されて文字列の配列になった元のコマンドライン入力。
        return {'isValid': <Boolean>, 'errorMessage': <String>} : booleanは入力が有効かどうかに依存し、
        有効でない場合は文字列のエラーメッセージが設定されます。  

        すべてのコマンドで有効なトークンに必要な Mtoolsのルールは以下の通りです。
            - トークンの数は3である必要があります。
            - 最初のトークンは "MTools" である必要があります。
            - 第二トークンは以下の1つになります。
            {"add", "subtract", "multiply", "divide", "exp", "log", "abs","sqrt", "round", "ceil", "floor"}
            - 第三のトークンの引数は、変換された数値を、","で分割することで、さらに解析できるようにする必要があります。
    */
    static universalValidator(parsedStringInputArray)
    {
        let validCommandList = ["add", "subtract", "multiply", "divide", "exp", "log", "abs", "sqrt", "round", "ceil", "floor"];
        if (parsedStringInputArray[0] != 'MTools'){
            return {'isValid': false, 'errorMessage': `only MTools package supported by this app. input must start with 'MTools'`}
        }
        if (parsedStringInputArray.length != 3){
            return {'isValid': false, 'errorMessage': `command line input must contain exactly 3 elements: 'packageName commandName arguments'`};
        }
        if (validCommandList.indexOf(parsedStringInputArray[1]) == -1){
            return {'isValid': false, 'errorMessage': `MTools only supports the following commands: ${validCommandList.join(",")}`};
        }
        if (!MTools.allStringElementsOfArrayContainNumbers(parsedStringInputArray[2].split(','))){
            return {'isValid': false, 'errorMessage': `last element of command line input, arguments, should contain only numbers and commas`};
        }

        return {'isValid': true, 'errorMessage': ''}
    }

    /*
        StringArray parsedStringInputArray : " "で分割されて文字列の配列になった元のコマンドライン入力。
        return {'isValid': <Boolean>, 'errorMessage': <String>} : booleanは入力が有効かどうかに依存し、
        有効でない場合は文字列のエラーメッセージが設定されます。

        このメソッドは、与えられたコマンドが1つか2つかの引数を必要とするかどうかに応じて、
        validatorをさらに呼び出します。
    */
    static commandArgumentsValidator(commandArgsArray)
    {
        let singleArgumentCommands = ['abs', 'sqrt', 'ceil', 'round', 'floor'];
        let doubleArgumentCommands = ['add', 'subtract', 'divide', 'multiply', 'exp', 'log'];
        let argsArray = commandArgsArray[1].split(",").map(stringArg=>Number(stringArg))

        // 与えられたコマンドが単一の引数を必要とする場合、コマンドと引数をsingle argument validatorに渡します。
        if (singleArgumentCommands.indexOf(commandArgsArray[0]) != -1){
            return MTools.singleArgValidator(commandArgsArray[0], argsArray);
        }
  
        // 与えられたコマンドが2つの引数を必要とする場合、コマンドと引数をdouble argument validatorに渡します。
        if (doubleArgumentCommands.indexOf(commandArgsArray[0]) != -1){
            return MTools.doubleArgValidator(commandArgsArray[0], argsArray);
        }
    }

    /*
        StringArray parsedStringInputArray : " "で分割されて文字列の配列になった元のコマンドライン入力。
        return {'isValid': <Boolean>, 'errorMessage': <String>} : booleanは入力が有効かどうかに依存し、
        有効でない場合は文字列のエラーメッセージが設定されます。

        MToolsの単一引数コマンドにおける有効なトークンのルール:
            - 引数の数はちょうど1である必要があります。
            - 二番目のトークンが'sqrt'の場合、引数は負の値であってはいけません。
    */
    static singleArgValidator(commandName, argsArray){
        if (argsArray.length != 1)
            return {'isValid': false, 'errorMessage': `command ${commandName} requires exactly 1 argument`};
        if(commandName == 'sqrt' && argsArray[1] < 0)
            return {'isValid': false, 'errorMessage': `command ${commandName} only supports arguments with value >= 0`}

        return {'isValid': true, 'errorMessage': ''}
    }

    /*
        StringArray parsedStringInputArray : " "で分割されて文字列の配列になった元のコマンドライン入力。
        return {'isValid': <Boolean>, 'errorMessage': <String>} : booleanは入力が有効かどうかに依存し、
        有効でない場合は文字列のエラーメッセージが設定されます。

        MToolsの2つの引数コマンドにおける有効なトークンのルール:
            - 引数の数はちょうど2である必要があります。
            - 二番目のトークンが'sqrt'の場合、引数は負の値であってはいけません。
            - 二番目のトークンが'log'の場合、最初の引数は1より大きい必要があります。
            - 二番目のトークンが'divide'の場合、第二引数は0であってはいけません。
    */
    static doubleArgValidator(commandName, argsArray){
        if (argsArray.length != 2){
            return {'isValid': false, 'errorMessage': `command ${commandName} requires exactly 2 arguments`};
        }
        if(commandName == 'divide' && argsArray[1] == 0){
            return {'isValid': false, 'errorMessage': `command ${commandName} requires divisors != 0`}
        }
        if(commandName == 'log' && (argsArray[0] <= 0) || argsArray[0] == 1){
            return {'isValid': false, 'errorMessage': `command ${commandName} requires a base > 0 and not equal to 1`}
        }
        if(commandName == 'log' && (argsArray[0] <= 0) || argsArray[0] == 1){
            return {'isValid': false, 'errorMessage': `command ${commandName} requires a positive antilogarithm`}
        }

        return {'isValid': true, 'errorMessage': ''}
    }

    /*
        StringArray inputArray : 文字列の配列
        return Boolean : すべての文字列を数値に解析できる場合はtrue、そうでない場合はfalse
        note: 変換された文字列がデータ型"number"を持っているかどうかを確認したいのですが、
        文字を含む文字列(例:"one")を与えた場合、変換された文字列は"NaN"を生成し、
        これは数値とみなされてしまうので注意が必要です。 

        変換された文字列がNumber型であること、またNaN型でないことを確認するために、追加のチェックが必要です。
    */
    static allStringElementsOfArrayContainNumbers(inputArray)
    {
        return inputArray.reduce((elementsAreNumbers, currentElement)=> {
                    let parsedNum = Number(currentElement);
                    return elementsAreNumbers && (typeof parsedNum == 'number') && !isNaN(parsedNum);
                }, true);
    }

    static appendEchoParagraph(parentDiv)
    {
        parentDiv.innerHTML+=
            `<p class="m-0">
                <span style='color:green'>student</span>
                <span style='color:magenta'>@</span>
                <span style='color:blue'>recursionist</span>
                : ${CLITextInput.value}
            </p>`;

        return;
    }
    
    static appendResultParagraph(parentDiv, isValid, message)
    {
        let promptName = "";
        let promptColor = "";
        if (isValid){
            promptName = "MTools";
            promptColor = "turquoise";
        }
        else{
            promptName = "MToolsError";
            promptColor = "red";
        }
        parentDiv.innerHTML+=
                `<p class="m-0">
                    <span style='color: ${promptColor}'>${promptName}</span>: ${message}
                </p>`;
        return;
    }

   /*
        StringArray : 文字列トークンに変換されたコマンドライン
        return String : 演算結果
        
        このメソッドは、CLIOutputDivに表示されるコンテンツを生成します。
   */
    static evaluatedResultsStringFromParsedCLIArray(PCA){
        let result = 0;
        let argsArray = PCA[2].split(",").map(stringArgument=>Number(stringArgument));
        let argA = argsArray[0];
        let argB = argsArray[1];

        if (PCA[1] == "add" ) result = argA+argB;
        else if (PCA[1] == "subtract" ) result = argA-argB;
        else if (PCA[1] == "multiply" ) result = argA*argB;
        else if (PCA[1] == "divide" ) result =  argA/argB;
        else if (PCA[1] == "exp" ) result = Math.pow(argA, argB);
        else if (PCA[1] == "log" ) result = Math.log(argB)/Math.log(argA);
        else if (PCA[1] == "sqrt" ) result = Math.sqrt(argA);
        else if (PCA[1] == "abs" ) result = Math.abs(argA);
        else if (PCA[1] == "round" ) result = Math.round(argA);
        else if (PCA[1] == "ceil" ) result = Math.ceil(argA);
        else if (PCA[1] == "floor" ) result = Math.floor(argA);
        else console.log("MTools.evaluatedResultsStringFromParsedCLIArray:: invalid command name")

        return "your result is: "+result;
    }

}