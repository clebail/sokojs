<?php

$niveau = $_POST["niveau"];
$ok = array(' ', '#', '$', '.', '*', '@', '+');
$result = array("nbRow" => 0, "nbCol" => 0, "data" => array(), "scores" => array());

if(($handle = fopen("level".str_pad($niveau, 4, "0", STR_PAD_LEFT).".xsb", "r")) !== false) {
    while(($line = fgets($handle)) !== false) {
        $resultLine = array();
        
        for($i=0;$i<strlen($line);$i++) {
            $car = substr($line, $i, 1);
            if(in_array($car, $ok)) {
                $resultLine[] = $car;
            }
        }
        
        $result["nbRow"]++;
        $result["nbCol"] = max($result["nbCol"], count($resultLine));
        $result["data"][] = $resultLine;
    }
    
    fclose($handle);
}

$result["scores"] = []; //$this->getScores($niveau);

echo json_encode($result);
