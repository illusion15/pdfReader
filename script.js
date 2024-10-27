document.getElementById('pdfFile').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
  }

  const fileReader = new FileReader();

  fileReader.onload = function() {
      const typedarray = new Uint8Array(this.result);

      pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
          let questions = []; // Array to store the questions and options

          const totalPages = pdf.numPages;
          const getPageText = (pageNum) => {
              return pdf.getPage(pageNum).then(function(page) {
                  return page.getTextContent().then(function(textContent) {
                      const pageText = textContent.items.map(item => item.str).join('\n');
                      return pageText;
                  });
              });
          };

          const readAllPages = async () => {
              let pdfText = '';
              for (let i = 1; i <= totalPages; i++) {
                  const pageText = await getPageText(i);
                  pdfText += pageText + '\n'; // Concatenate text from all pages
              }
              processText(pdfText);
          };

          readAllPages();

          // Function to process the extracted text and segregate questions and options
          function processText(text) {
              const lines = text.split('\n'); // Split text into lines
              let currentQuestion = null;
              let collectingQuestion = false; // Flag to indicate if we are collecting the question text
              let currentOption = null;

              for (let line of lines) {
                  line = line.trim(); // Remove extra spaces

                  // Check if line starts with "Q.{number}" pattern
                  const questionMatch = line.match(/^Q\.(\d+)\)/);
                  if (questionMatch) {
                      // Save the previous question if exists
                      if (currentQuestion) {
                          questions.push(currentQuestion);
                      }
                      // Start a new question
                      currentQuestion = { Question: line.replace(/^Q\.\d+\)\s*/, ''), Options: [] };
                      collectingQuestion = true; // Start collecting the question text
                      currentOption = null;
                  } else if (/^[1-4]\.\s*/.test(line) && currentQuestion) {
                      // Check if line starts with "1.", "2.", "3.", or "4." pattern for options
                      currentOption = line.replace(/^[1-4]\.\s*/, '');
                      currentQuestion.Options.push(currentOption);
                      collectingQuestion = false; // Stop collecting the question text
                  } else if (currentOption && currentQuestion) {
                      // If the line is part of the previous option (split across multiple lines), add it
                      currentOption += ' ' + line;
                      currentQuestion.Options[currentQuestion.Options.length - 1] = currentOption;
                  } else if (collectingQuestion && currentQuestion) {
                      // If we are still collecting the question text, add the line to the question
                      currentQuestion.Question += ' ' + line;
                  }
              }

              // Add the last question if exists
              if (currentQuestion) {
                  questions.push(currentQuestion);
              }

              // Output the parsed questions and options
              console.log(questions);
              displayQuestions(questions);
          }

          // Function to display the segregated questions and options in sets of 25
          function displayQuestions(questions) {
              const output = document.getElementById('pdfText');
              output.textContent = ''; // Clear previous output

              // Divide questions into sets of 25
              const sets = [];
              for (let i = 0; i < questions.length; i += 25) {
                  sets.push(questions.slice(i, i + 25));
              }

              // Display each set of 25 questions
              sets.forEach((set, setIndex) => {
                  output.textContent += `Set ${setIndex + 1}\n\n`;
                  set.forEach((q, index) => {
                      // Display the question text
                    //   output.textContent += `Question ${index + 1}: ${q.Question}\n`;
                      output.textContent += `Question!${q.Question}\n`;
                      output.textContent += `Type!multiple_choice\n`;
                      q.Options.forEach((option, i) => {
                          output.textContent += `Option!${option}\n`;
                      });
                      output.textContent += `Answer!\n`;
                      output.textContent += `Solution!\n`;
                      output.textContent += `Positive Marks!2\n`;
                      output.textContent += `Negative Marks!0.25\n`;
                      output.textContent += '\n';
                  });
                  output.textContent += '\n===============================================================================================\n\n';
              });
              
          }
      });
  };

  fileReader.readAsArrayBuffer(file);
});
