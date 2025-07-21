using BepInEx;
using BepInEx.Logging;
using HarmonyLib;
using System;
using System.IO;
using System.Reflection;

namespace LettersToTextFile
{
    [BepInPlugin(modGUID, modName, modVersion)]
    public class LettersToTextFileMod : BaseUnityPlugin
    {
        private const string modGUID = "WordPlay.LettersToTextFile";
        private const string modName = "LettersToTextFile";
        private const string modVersion = "1.0.0";

        private static string previousLetters = "";

        private readonly Harmony harmony = new Harmony(modGUID);
        internal static ManualLogSource ModLogger;

        public static LettersToTextFileMod Instance;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }

            harmony.PatchAll();
            ModLogger = BepInEx.Logging.Logger.CreateLogSource(modName);
            ModLogger.LogInfo($"Plugin {modName} is loaded!");
        }

        [HarmonyPatch(typeof(LetterBagManager))]
        class LetterBagManager_Patches
        {
            [HarmonyPostfix]
            // Since we cannot attach an observer to the list, we fire a letter check after every
            // method that mutates the "LettersInPlay" list in any way (as determined from reading
            // the source code in dnSpy).
            [HarmonyPatch("LoadLetterBag")]
            [HarmonyPatch("UseNormalBag")]
            [HarmonyPatch("SetUpLetterBag")]
            [HarmonyPatch("LoadLetters")]
            [HarmonyPatch("GetNewLetter")]
            [HarmonyPatch("GetNewUniqueLetter")]
            [HarmonyPatch("GetSpecificLetter")]
            [HarmonyPatch("GetNewVowelOldVersion")]
            [HarmonyPatch("GetNewVowel")]
            [HarmonyPatch("GetNewConsonant")]
            [HarmonyPatch("GetNewConsonantOldVersion")]
            [HarmonyPatch("UpdateNextFourLetters")]
            [HarmonyPatch("RandomiseLetters")]
            [HarmonyPatch("AddLetter")]
            [HarmonyPatch("RemoveLettersFromSpent")]
            [HarmonyPatch("AddExtraLetters")]
            [HarmonyPatch("DestroySubmittedTile")]
            [HarmonyPatch("ChangeAllToType")]
            public static void UniversalPostfix(MethodBase __originalMethod)
            {
                string currentLetters = string.Join("\n", LetterBagManager.Instance.LettersInPlay);
                if (currentLetters == previousLetters)
                {
                    return;
                }
                previousLetters = currentLetters;

                string filePath = @"D:\SteamLibrary\steamapps\common\Word Play\current-letters.txt";

                try
                {
                    File.WriteAllText(filePath, currentLetters);
                }
                catch (Exception ex)
                {
                    ModLogger.LogError($"Error writing to file: {ex.Message}");
                }
            }
        }
    }
}
