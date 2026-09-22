import unittest
from release import Release,WORKER,R2,ACCOUNT
class ReleaseScope(unittest.TestCase):
 def setUp(self):self.release=Release.__new__(Release)
 def test_other_worker_is_refused(self):
  with self.assertRaisesRegex(ValueError,'API_TARGET_REFUSED'):self.release.request(f'/accounts/{ACCOUNT}/workers/scripts/csv-auth','PUT',b'')
 def test_other_object_is_refused(self):
  with self.assertRaisesRegex(ValueError,'WRITE_TARGET_REFUSED'):self.release.request(R2+'/objects/tea%2Fpeca-jornada.webp','PUT',b'')
 def test_metadata_write_is_refused(self):
  with self.assertRaisesRegex(ValueError,'POST_TARGET_REFUSED'):self.release.request(WORKER+'/settings','POST',b'')
 def test_deletion_is_refused(self):
  with self.assertRaisesRegex(ValueError,'METHOD_REFUSED'):self.release.request(R2+'/objects/tea%2Findex.html','DELETE')
 def test_global_purge_is_not_in_commands(self):
  import inspect
  self.assertNotIn('purge_everything',inspect.getsource(Release.purge))
if __name__=='__main__':unittest.main()
