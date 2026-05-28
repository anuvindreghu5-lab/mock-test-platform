from django.test import SimpleTestCase

from .pdf_parser_images import _detect_subject_from_text


class PdfParserSubjectDetectionTests(SimpleTestCase):
	def test_detects_computer_subjects(self):
		self.assertEqual(
			_detect_subject_from_text("Computer science logic circuits and programming"),
			"computer"
		)

	def test_detects_electronics_subjects(self):
		self.assertEqual(
			_detect_subject_from_text("EC digital circuits and transistor logic"),
			"electronics"
		)

	def test_detects_math_physics_chemistry_subjects(self):
		self.assertEqual(_detect_subject_from_text("Find the integral of x^2"), "math")
		self.assertEqual(_detect_subject_from_text("Force equals mass times acceleration"), "physics")
		self.assertEqual(_detect_subject_from_text("Mole concept and titration reactions"), "chemistry")
